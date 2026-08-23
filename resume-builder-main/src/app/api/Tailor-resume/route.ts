// src/app/api/tailor-resume/route.ts
import { NextRequest } from 'next/server';
import { parseAIJson } from '@/lib/aiJson';
import { getModel, checkRateLimit, getCached, setCached, makeCacheKey, friendlyError } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 3 per minute — complex task ──
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip, 3);
    if (!allowed) {
      return Response.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { resume, jobDescription } = await request.json();
    if (!resume || !jobDescription) {
      return Response.json({ error: 'Resume and job description are required.' }, { status: 400 });
    }

    // ── Cache check ──
    const cacheKey = makeCacheKey('tailor', {
      name: resume.name,
      title: resume.title,
      jobDescSnippet: jobDescription.slice(0, 300),
    });
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ resume: cached, cached: true });

    // ── Use smart model — needs to understand job desc deeply ──
    const model = getModel({ smart: true, temperature: 0.6, maxOutputTokens: 1500 });

    const prompt = `Tailor this resume to the job description. Return ONLY valid JSON, same structure as input.

Job Description:
${jobDescription.slice(0, 1500)}

Resume:
${JSON.stringify(resume, null, 2)}

Rules:
- Rewrite summary to address job requirements directly
- Strengthen and reorder bullets to highlight relevant experience
- Add missing keywords naturally — do NOT invent experience
- Keep all facts accurate
- Keep exact same JSON field names and structure`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const tailored = parseAIJson(text);

    setCached(cacheKey, tailored, 1800);
    return Response.json({ resume: tailored });

  } catch (e) {
    console.error('Tailor resume error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
