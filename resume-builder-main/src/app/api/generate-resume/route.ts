// src/app/api/generate-resume/route.ts
import { NextRequest } from 'next/server';
import { parseAIJson } from '@/lib/aiJson';
import { getModel, checkRateLimit, friendlyError } from '@/lib/gemini';

type GeneratedSection = Record<string, unknown> & {
  period?: string;
  dates?: string;
};

function splitList(value: unknown): string[] {
  return typeof value === 'string'
    ? value.split(/[\n,]/).map(item => item.trim()).filter(Boolean)
    : [];
}

const PLACEHOLDER_PATTERN = /\[[^\]]+\]/g;

function cleanGeneratedText(value: unknown): string {
  return typeof value === 'string'
    ? value.replace(PLACEHOLDER_PATTERN, '').replace(/\s{2,}/g, ' ').trim()
    : '';
}

function cleanGeneratedList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => cleanGeneratedText(item))
    .filter(Boolean);
}

function fallbackBullet(role: unknown, company: unknown): string {
  const roleText = cleanGeneratedText(role) || 'the role';
  const companyText = cleanGeneratedText(company);
  return companyText
    ? `Supported ${roleText} work at ${companyText} by coordinating tasks, solving problems, and delivering reliable outcomes.`
    : `Supported ${roleText} work by coordinating tasks, solving problems, and delivering reliable outcomes.`;
}

export async function POST(request: NextRequest) {
  try {
    // ── Rate limit: 3 per minute — most expensive call ──
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
    const { allowed, retryAfter } = checkRateLimit(ip, 3);
    if (!allowed) {
      return Response.json(
        { error: `Rate limit reached. Please wait ${retryAfter} seconds and try again.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const form = await request.json();

    // ── Use smart model — most important call, needs best quality ──
    const model = getModel({ smart: true, temperature: 0.7, maxOutputTokens: 1500 });

    const prompt = `You are an expert resume writer. Create an ATS-friendly resume from this information.

Output ONLY valid JSON, no markdown, no extra text.

User info:
${JSON.stringify(form, null, 2)}

Rules for bullets:
- Start every bullet with an action verb (Led, Built, Increased, Delivered)
- Quantify achievements (%, $, team size, time saved)
- Max 120 characters per bullet
- 3-5 bullets per role
- Preserve the user's photo, languages, and hobbies if provided
- Never use bracket placeholders like [metric], [project], [number], or [action]. If details are missing, write a truthful general bullet.

Return this exact structure:
{
  "name": string,
  "title": string,
  "email": string,
  "phone": string,
  "location": string,
  "linkedin": string,
  "photo": string,
  "summary": string,
  "experience": [
    {
      "company": string,
      "role": string,
      "period": string,
      "bullets": ["bullet 1", "bullet 2", "bullet 3"]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "period": string
    }
  ],
  "skills": ["skill1", "skill2"],
  "languages": ["language 1"],
  "hobbies": ["hobby 1"],
  "achievements": ["achievement 1", "certification 1"]
}

Important: use "period" not "dates" for date ranges. use "title" not "jobTitle".`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const resumeData = parseAIJson<Record<string, unknown>>(text);

    // Normalize field names in case AI returns wrong keys
    const r = resumeData as Record<string, unknown> & {
      title?: string;
      jobTitle?: string;
      experience?: GeneratedSection[];
      education?: GeneratedSection[];
    };
    const normalized = {
      ...r,
      name: cleanGeneratedText(r.name) || cleanGeneratedText(form.name),
      title: cleanGeneratedText(r.title ?? r.jobTitle) || cleanGeneratedText(form.title),
      email: cleanGeneratedText(r.email) || cleanGeneratedText(form.email),
      phone: cleanGeneratedText(r.phone) || cleanGeneratedText(form.phone),
      location: cleanGeneratedText(r.location) || cleanGeneratedText(form.location),
      linkedin: cleanGeneratedText(r.linkedin) || cleanGeneratedText(form.linkedin),
      summary: cleanGeneratedText(r.summary),
      photo: typeof form.photo === 'string' ? form.photo : '',
      experience: (r.experience ?? []).map(e => ({
        ...e,
        company: cleanGeneratedText(e.company),
        role: cleanGeneratedText(e.role),
        period: cleanGeneratedText(e.period ?? e.dates),
        bullets: cleanGeneratedList(e.bullets).length
          ? cleanGeneratedList(e.bullets)
          : [fallbackBullet(e.role, e.company)],
      })),
      education: (r.education ?? []).map(e => ({
        ...e,
        institution: cleanGeneratedText(e.institution),
        degree: cleanGeneratedText(e.degree),
        period: cleanGeneratedText(e.period ?? e.dates),
      })),
      skills: cleanGeneratedList(r.skills).length ? cleanGeneratedList(r.skills) : splitList(form.skills),
      languages: cleanGeneratedList(r.languages).length ? cleanGeneratedList(r.languages) : splitList(form.languages),
      hobbies: cleanGeneratedList(r.hobbies).length ? cleanGeneratedList(r.hobbies) : splitList(form.hobbies),
      achievements: cleanGeneratedList(r.achievements),
    };

    return Response.json({ resume: normalized });

  } catch (e) {
    console.error('Resume generation error:', e);
    return Response.json({ error: friendlyError(e) }, { status: 500 });
  }
}
