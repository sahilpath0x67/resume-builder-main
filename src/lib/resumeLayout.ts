import type { ResumeOutput } from './types';

export type ResumeDensityLevel = 'roomy' | 'relaxed' | 'balanced' | 'compact';

export interface ResumeDensity {
  level: ResumeDensityLevel;
  words: number;
  bullets: number;
  scale: number;
  gapScale: number;
}

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

export function getResumeDensity(resume: ResumeOutput): ResumeDensity {
  const bullets = resume.experience.flatMap(exp => exp.bullets ?? []).filter(Boolean);
  const sections = [
    resume.summary,
    resume.experience.length ? 'experience' : '',
    resume.education.length ? 'education' : '',
    resume.skills.length ? 'skills' : '',
    resume.languages.length ? 'languages' : '',
    resume.hobbies.length ? 'hobbies' : '',
    resume.achievements.length ? 'achievements' : '',
  ].filter(Boolean).length;
  const words = countWords([
    resume.name,
    resume.title,
    resume.summary,
    ...bullets,
    ...resume.skills,
    ...resume.languages,
    ...resume.hobbies,
    ...resume.achievements,
  ].join(' '));

  const densityScore = words + bullets.length * 18 + sections * 22 + resume.skills.length * 3;

  if (densityScore < 260) {
    return { level: 'roomy', words, bullets: bullets.length, scale: 1.2, gapScale: 1.36 };
  }

  if (densityScore < 420) {
    return { level: 'relaxed', words, bullets: bullets.length, scale: 1.1, gapScale: 1.18 };
  }

  if (densityScore > 820) {
    return { level: 'compact', words, bullets: bullets.length, scale: 0.94, gapScale: 0.9 };
  }

  return { level: 'balanced', words, bullets: bullets.length, scale: 1, gapScale: 1 };
}

export function scalePx(value: number, density: ResumeDensity, min?: number, max?: number): number {
  const scaled = value * density.scale;
  return Math.max(min ?? scaled, Math.min(max ?? scaled, scaled));
}

export function scaleGap(value: number, density: ResumeDensity, min?: number, max?: number): number {
  const scaled = value * density.gapScale;
  return Math.max(min ?? scaled, Math.min(max ?? scaled, scaled));
}
