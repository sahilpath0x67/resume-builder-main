// src/app/api/linkedin-summary/route.ts
import { NextRequest } from 'next/server';
import { getModel, checkRateLimit, getCached, setCached, makeCacheKey, friendlyError } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 5 per minute ──
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip, 5);
    if (!allowed) {
      return Response.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const { resume } = await request.json();
    if (!resume) return Response.json({ error: 'Resume data is required.' }, { status: 400 });

    // ── Cache check ──
    const cacheKey = makeCacheKey('linkedin', {
      name: resume.name,
      title: resume.title,
      skills: resume.skills,
      expCount: resume.experience?.length,
    });
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ linkedin: cached, cached: true });

    // ── Use flash-lite — medium length output ──
    const model = getModel({ smart: false, temperature: 0.7, maxOutputTokens: 500 });

    const prompt = `Write a LinkedIn About section in first person. 3-4 paragraphs, 1800-2400 characters. Output ONLY the text, no headings, no labels.

Candidate:
- Name: ${resume.name}
- Title: ${resume.title}
- Summary: ${resume.summary || 'N/A'}
- Skills: ${resume.skills?.join(', ') || 'N/A'}
- Experience: ${resume.experience?.map((e: {role: string; company: string; bullets?: string[]}) => `${e.role} at ${e.company}`).join(', ') || 'N/A'}
- Achievements: ${resume.achievements?.join(', ') || 'N/A'}

Rules: Start with a hook. Use "I" statements. End with a call to action. No buzzwords.`;

    const result = await model.generateContent(prompt);
    const linkedin = result.response.text().trim();

    if (!linkedin) throw new Error('AI returned empty response.');

    setCached(cacheKey, linkedin, 3600);
    return Response.json({ linkedin });

  } catch (e) {
    console.error('LinkedIn error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}