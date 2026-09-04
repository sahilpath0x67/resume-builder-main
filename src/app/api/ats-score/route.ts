// src/app/api/ats-score/route.ts
import { NextRequest } from 'next/server';
import { parseAIJson } from '@/lib/aiJson';
import { getModel, checkRateLimit, getCached, setCached, makeCacheKey, friendlyError } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 5 per minute (medium complexity) ──
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip, 5);
    if (!allowed) {
      return Response.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { resume, jobDescription } = await request.json();
    if (!resume) return Response.json({ error: 'Resume data is required.' }, { status: 400 });

    // ── Cache check (cache for 30 min — scores don't change often) ──
    const cacheKey = makeCacheKey('ats', {
      name: resume.name,
      skills: resume.skills,
      expCount: resume.experience?.length,
      jobDesc: jobDescription?.slice(0, 200), // only first 200 chars for cache key
    });
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ ...(cached as object), cached: true });

    // ── Use flash-lite — structured JSON output, medium complexity ──
    const model = getModel({ smart: false, temperature: 0.3, maxOutputTokens: 600 });

    const prompt = `ATS resume analysis. Return ONLY valid JSON, no markdown.

Resume summary:
- Name: ${resume.name}
- Title: ${resume.title}
- Skills: ${resume.skills?.join(', ') || 'none'}
- Experience: ${resume.experience?.map((e: {role: string; company: string; bullets?: string[]}) => `${e.role} at ${e.company}: ${e.bullets?.slice(0,2).join('; ')}`).join(' | ') || 'none'}
- Summary: ${resume.summary || 'none'}

Job Description: ${jobDescription || 'Not provided — do a general ATS analysis.'}

Return:
{
  "overallScore": <0-100>,
  "breakdown": {
    "keywords":       { "score": <0-100>, "feedback": "<one sentence>" },
    "formatting":     { "score": <0-100>, "feedback": "<one sentence>" },
    "quantification": { "score": <0-100>, "feedback": "<one sentence>" },
    "summaryStrength":{ "score": <0-100>, "feedback": "<one sentence>" },
    "skillsMatch":    { "score": <0-100>, "feedback": "<one sentence>" }
  },
  "missingKeywords": ["keyword1", "keyword2"],
  "topSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = parseAIJson<{ overallScore?: number; breakdown?: unknown }>(text);

    if (!parsed.overallScore || !parsed.breakdown) {
      throw new Error('Invalid response from AI.');
    }

    setCached(cacheKey, parsed, 1800); // cache 30 min
    return Response.json(parsed);

  } catch (e) {
    console.error('ATS Score error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
