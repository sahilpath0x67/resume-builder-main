// src/app/api/generate-cover-letter/route.ts
import { NextRequest } from 'next/server';
import { getModel, checkRateLimit, getCached, setCached, makeCacheKey, friendlyError } from '@/lib/gemini';

const TONE_INSTRUCTIONS: Record<string, string> = {
  professional:  'Formal and polished. Confident but not boastful.',
  enthusiastic:  'Warm and energetic. Show genuine excitement. Still professional.',
  concise:       'Very short. 3 paragraphs max. Every word earns its place.',
};

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

    const { resume, jobDescription, companyName, hiringManager, tone = 'professional' } = await request.json();
    if (!resume) return Response.json({ error: 'Resume data is required.' }, { status: 400 });

    const company  = companyName?.trim()    || 'the company';
    const manager  = hiringManager?.trim()  || 'Hiring Manager';
    const toneGuide = TONE_INSTRUCTIONS[tone] ?? TONE_INSTRUCTIONS.professional;

    // ── Cache check ──
    const cacheKey = makeCacheKey('cover-letter', {
      name: resume.name, title: resume.title,
      company, tone,
      jobDescSnippet: jobDescription?.slice(0, 150),
    });
    const cached = getCached(cacheKey);
    if (cached) return Response.json({ coverLetter: cached, cached: true });

    // ── Use smart model — cover letters need quality ──
    const model = getModel({ smart: true, temperature: 0.8, maxOutputTokens: 600 });

    const prompt = `Write a cover letter. Output ONLY the letter body — no date, no address, no signature.

Company: ${company}
Addressed to: ${manager}
Tone: ${toneGuide}

Candidate:
- Name: ${resume.name}, Title: ${resume.title}
- Summary: ${resume.summary || 'N/A'}
- Top skills: ${resume.skills?.slice(0, 8).join(', ') || 'N/A'}
- Experience: ${resume.experience?.slice(0, 2).map((e: {role: string; company: string; bullets?: string[]}) => `${e.role} at ${e.company}: ${e.bullets?.slice(0,2).join('; ')}`).join(' | ') || 'N/A'}

Job description: ${jobDescription?.trim() || 'Not provided — write a general compelling letter.'}

Rules:
- 3-4 paragraphs
- Strong opening hook (not "I am writing to apply")
- Paragraph 2: one specific quantified achievement
- Paragraph 3: connect skills to this company/role
- Final: confident call to action`;

    const result = await model.generateContent(prompt);
    const coverLetter = result.response.text().trim();

    if (!coverLetter) throw new Error('AI returned empty response.');

    setCached(cacheKey, coverLetter, 3600);
    return Response.json({ coverLetter });

  } catch (e) {
    console.error('Cover letter error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}