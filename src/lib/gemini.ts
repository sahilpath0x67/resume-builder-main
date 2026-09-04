// src/lib/gemini.ts
// Single place to manage all AI model config and rate limiting

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ── Models ────────────────────────────────────────────────────────────────────
// Try newer low-cost models first. The older 2.0 flash-lite model can report
// free-tier quota=0 for some API keys, so we keep fallbacks instead of hard
// failing every AI feature.
function uniqueModels(models: Array<string | undefined>): string[] {
  return [...new Set(models.filter(Boolean) as string[])];
}

export const FAST_MODELS = uniqueModels([
  process.env.GEMINI_FAST_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-lite',
]);

export const SMART_MODELS = uniqueModels([
  process.env.GEMINI_SMART_MODEL,
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash-lite',
]);

export const FAST_MODEL = FAST_MODELS[0];
export const SMART_MODEL = SMART_MODELS[0];

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /429|quota|RESOURCE_EXHAUSTED|Too Many Requests/i.test(msg);
}

export function getModel(config?: {
  temperature?: number;
  maxOutputTokens?: number;
  smart?: boolean; // true = use flash, false = use flash-lite
}) {
  const models = config?.smart !== false ? SMART_MODELS : FAST_MODELS;
  const generationConfig = {
    temperature: config?.temperature ?? 0.7,
    maxOutputTokens: config?.maxOutputTokens ?? 1000,
  };

  return {
    async generateContent(prompt: string) {
      let lastError: unknown;

      for (const model of models) {
        try {
          return await genAI.getGenerativeModel({ model, generationConfig }).generateContent(prompt);
        } catch (error) {
          lastError = error;
          if (!isQuotaError(error)) throw error;
          console.warn(`Gemini model ${model} hit quota; trying next fallback.`);
        }
      }

      throw lastError;
    },
  };
}

// ── In-memory rate limiter ─────────────────────────────────────────────────────
// Tracks requests per IP per minute to prevent abuse
// Resets every minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  limitPerMinute: number = 10
): { allowed: boolean; retryAfter: number } {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= limitPerMinute) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true, retryAfter: 0 };
}

// ── Simple in-memory cache ─────────────────────────────────────────────────────
// Caches results for identical inputs for 1 hour
// Saves API calls when users click the same thing multiple times
const cache = new Map<string, { result: unknown; expiresAt: number }>();

export function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.result;
}

export function setCached(key: string, result: unknown, ttlSeconds = 3600) {
  cache.set(key, { result, expiresAt: Date.now() + ttlSeconds * 1000 });
  // Keep cache from growing too large — max 500 entries
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

export function makeCacheKey(route: string, data: unknown): string {
  return `${route}:${JSON.stringify(data)}`;
}

export const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('API key') || msg.includes('API_KEY_INVALID')) {
    return 'Gemini API key is invalid. Update GEMINI_API_KEY in .env.local.';
  }
  if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'Gemini quota is unavailable for this API key/model. Try again shortly, or update GEMINI_API_KEY / enable billing in Google AI Studio.';
  }
  if (msg.includes('404') || msg.includes('not found')) {
    return 'AI model unavailable. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
