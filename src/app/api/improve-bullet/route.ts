// src/app/api/improve-bullet/route.ts
import { NextRequest } from 'next/server';
import { getModel, checkRateLimit, getCached, setCached, makeCacheKey, friendlyError } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 15 per minute (simple task) ──
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip, 15);
    if (!allowed) {
      return Response.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { bullet, role, company } = await request.json();
    if (!bullet?.trim()) return Response.json({ error: 'Bullet text is required.' }, { status: 400 });

    // ── Cache check ──
    const cacheKey = makeCacheKey('improve-bullet', { bullet: bullet.trim(), role, company });
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ improved: cached, cached: true });

    // ── Use flash-lite — simple short task ──
    const model = getModel({ smart: false, temperature: 0.6, maxOutputTokens: 120 });

    const prompt = `Rewrite this resume bullet to be stronger. Start with an action verb. Add metrics if possible. Max 120 characters. Output ONLY the rewritten bullet, no quotes, no explanation.

Role: ${role || 'Professional'}
Company: ${company || 'Company'}
Bullet: ${bullet.trim()}`;

    const result = await model.generateContent(prompt);
    const improved = result.response.text().trim().replace(/^["']|["']$/g, '');

    setCached(cacheKey, improved, 3600);
    return Response.json({ improved });

  } catch (e) {
    console.error('Improve bullet error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}