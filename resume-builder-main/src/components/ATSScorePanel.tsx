'use client';
import { useState } from 'react';
import type { ResumeOutput } from '../lib/types';
import { getAIErrorMessage } from '../lib/aiErrors';

interface ATSResult {
  overallScore: number;
  breakdown: Record<string, { score: number; feedback: string }>;
  missingKeywords: string[];
  topSuggestions: string[];
}

const LABELS: Record<string, string> = {
  formatting: 'Formatting',
  keywords: 'Keywords',
  quantification: 'Quantification',
  summaryStrength: 'Summary Strength',
  skillsMatch: 'Skills Match',
  contactInfo: 'Contact Info',
  length: 'Resume Length',
};

// ── General score computed locally — no API call ──────────────────────────────
function computeGeneralScore(resume: ResumeOutput): ATSResult {
  const scores: Record<string, { score: number; feedback: string }> = {};

  // 1. Contact info completeness
  const contactFields = [resume.email, resume.phone, resume.location, resume.linkedin];
  const contactFilled = contactFields.filter(Boolean).length;
  scores.contactInfo = {
    score: Math.round((contactFilled / 4) * 100),
    feedback: contactFilled === 4
      ? 'All contact fields filled — great.'
      : `Missing ${4 - contactFilled} contact field(s). Add ${[!resume.email && 'email', !resume.phone && 'phone', !resume.location && 'location', !resume.linkedin && 'LinkedIn'].filter(Boolean).join(', ')}.`,
  };

  // 2. Resume length
  const allText = [
    resume.summary,
    ...(resume.experience?.flatMap(e => e.bullets) ?? []),
    ...(resume.achievements ?? []),
  ].join(' ');
  const words = allText.trim().split(/\s+/).filter(Boolean).length;
  const lengthScore = words < 150 ? 40 : words < 250 ? 70 : words < 500 ? 100 : words < 700 ? 80 : 50;
  scores.length = {
    score: lengthScore,
    feedback: words < 150
      ? `Only ${words} words — too short. Aim for 250–500 words.`
      : words > 600
        ? `${words} words is too long. Trim to 250–500 for a one-pager.`
        : `${words} words — good length for ATS scanning.`,
  };

  // 3. Action verbs in bullets
  const ACTION_VERBS = ['led', 'built', 'created', 'developed', 'increased', 'decreased', 'reduced', 'improved', 'managed', 'delivered', 'launched', 'designed', 'implemented', 'optimised', 'optimized', 'grew', 'achieved', 'generated', 'saved', 'streamlined', 'automated', 'collaborated', 'coordinated', 'negotiated', 'trained', 'mentored', 'analyzed', 'established', 'initiated', 'drove', 'spearheaded', 'oversaw', 'supervised', 'executed'];
  const allBullets = resume.experience?.flatMap(e => e.bullets ?? []) ?? [];
  const bulletsWithVerbs = allBullets.filter(b =>
    ACTION_VERBS.some(v => b.toLowerCase().startsWith(v))
  ).length;
  const verbScore = allBullets.length === 0 ? 30 : Math.min(100, Math.round((bulletsWithVerbs / allBullets.length) * 100));
  scores.keywords = {
    score: verbScore,
    feedback: allBullets.length === 0
      ? 'No experience bullets found. Add achievements under each role.'
      : verbScore < 50
        ? `Only ${bulletsWithVerbs}/${allBullets.length} bullets start with an action verb. Start each with Led, Built, Increased, etc.`
        : `${bulletsWithVerbs}/${allBullets.length} bullets use action verbs — good.`,
  };

  // 4. Quantification
  const quantPattern = /\d+(%|\+|k|m|\$|x|\/|\s?(percent|users|customers|million|thousand|team|members|hours|days|weeks|months))/i;
  const quantified = allBullets.filter(b => quantPattern.test(b)).length;
  const quantScore = allBullets.length === 0 ? 30 : Math.min(100, Math.round((quantified / allBullets.length) * 100));
  scores.quantification = {
    score: quantScore,
    feedback: quantScore < 40
      ? `Only ${quantified}/${allBullets.length} bullets have numbers. Add metrics like %, $, team size, or time saved.`
      : `${quantified}/${allBullets.length} bullets are quantified${quantScore >= 80 ? ' — excellent.' : ' — try to quantify more.'}`,
  };

  // 5. Summary strength
  const summaryWords = resume.summary?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  const summaryScore = !resume.summary ? 20 : summaryWords < 20 ? 50 : summaryWords < 80 ? 100 : 70;
  scores.summaryStrength = {
    score: summaryScore,
    feedback: !resume.summary
      ? 'No summary found. Add a 2-3 sentence professional summary.'
      : summaryWords < 20
        ? 'Summary is too short. Aim for 40-80 words.'
        : summaryWords > 100
          ? 'Summary is too long. Keep it under 80 words.'
          : 'Summary length is good.',
  };

  // 6. Skills
  const skillCount = resume.skills?.length ?? 0;
  const skillScore = skillCount === 0 ? 0 : skillCount < 5 ? 50 : skillCount < 10 ? 80 : 100;
  scores.skillsMatch = {
    score: skillScore,
    feedback: skillCount === 0
      ? 'No skills listed. Add a skills section with 8-12 relevant skills.'
      : skillCount < 5
        ? `Only ${skillCount} skills listed. Add more relevant skills.`
        : `${skillCount} skills listed — good.`,
  };

  const overallScore = Math.round(
    Object.values(scores).reduce((sum, v) => sum + v.score, 0) / Object.keys(scores).length
  );

  const suggestions: string[] = [];
  if (scores.contactInfo.score < 100) suggestions.push('Complete all contact fields including LinkedIn profile URL.');
  if (scores.quantification.score < 60) suggestions.push('Add specific numbers to at least 3 bullet points (%, $, team size, time saved).');
  if (scores.keywords.score < 60) suggestions.push('Start every bullet point with a strong action verb like Led, Built, or Increased.');
  if (scores.summaryStrength.score < 80) suggestions.push('Write a 40-80 word professional summary highlighting your top skills and experience.');
  if (scores.skillsMatch.score < 80) suggestions.push('Add 8-12 relevant technical and soft skills to your skills section.');
  if (scores.length.score < 70) suggestions.push('Expand your experience bullets — aim for 3-5 bullets per role.');

  return {
    overallScore,
    breakdown: scores,
    missingKeywords: [],
    topSuggestions: suggestions.slice(0, 5),
  };
}

export default function ATSScorePanel({
  resume,
  dark: D,
}: {
  resume: ResumeOutput | null;
  dark: boolean;
}) {
  const [mode, setMode] = useState<'general' | 'job'>('general');
  const [jobDesc, setJobDesc] = useState('');
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!resume) { setError('Fill in your resume details first.'); return; }
    setError('');

    if (mode === 'general') {
      // ── Local computation — no API call, instant, free ──
      const generalResult = computeGeneralScore(resume);
      setResult(generalResult);
      return;
    }

    // ── Job description mode — calls API ──
    if (!jobDesc.trim()) { setError('Please paste a job description.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jobDesc }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(getAIErrorMessage(e, 'Analysis failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Color tokens ──
  const bg = D ? '#1f2937' : '#ffffff';
  const bgSubtle = D ? '#111827' : '#f9fafb';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const inputBg = D ? '#374151' : '#ffffff';
  const trackBg = D ? '#374151' : '#f3f4f6';

  const scoreColor = (s: number) => s >= 80 ? '#4ade80' : s >= 60 ? '#fbbf24' : '#f87171';
  const scoreText = (s: number) => s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';
  const barColor = (s: number) => s >= 80 ? '#4ade80' : s >= 60 ? '#fbbf24' : '#f87171';

  const card: React.CSSProperties = { background: bg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: 20, marginBottom: 16 };
  const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 10, border: `1px solid ${borderCol}`, background: inputBg, color: text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical', minHeight: 90, transition: 'border-color 0.15s' };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={card}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, flexShrink: 0 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>ATS Score Analyzer</p>
            <p style={{ margin: 0, fontSize: 11, color: textMuted }}>Check how well your resume passes automated screening</p>
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99, flexShrink: 0, background: resume ? '#DBEAFE' : D ? '#3b1e06' : '#fef3c7', color: resume ? '#1E3A8A' : D ? '#fbbf24' : '#92400e' }}>
            {resume ? '✓ Resume ready' : '⚠ Fill resume first'}
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: `1px solid ${borderCol}`, marginBottom: 16 }}>
          {([
            { id: 'general', label: '⚡ General Score', desc: 'Instant — no API needed' },
            { id: 'job', label: '🎯 Match to Job', desc: 'Paste a job description' },
          ] as const).map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResult(null); setError(''); }}
              style={{ flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: mode === m.id ? '#1D4ED8' : 'transparent', color: mode === m.id ? '#fff' : textMuted, transition: 'all 0.15s', textAlign: 'center' }}
            >
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: 10, opacity: 0.8 }}>{m.desc}</p>
            </button>
          ))}
        </div>

        {/* Job desc input — only shown in job mode */}
        {mode === 'job' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: textMuted, marginBottom: 6 }}>
              Job description <span style={{ color: '#1D4ED8' }}>*</span>
            </label>
            <textarea style={inp} rows={4} placeholder="Paste the full job description here for a tailored score…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
          </div>
        )}

        {/* General mode info */}
        {mode === 'general' && (
          <div style={{ background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0 }}>What we check (instantly, no AI)</p>
            {['Contact info completeness', 'Action verbs in bullet points', 'Quantified achievements', 'Professional summary', 'Skills section', 'Resume length'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ color: '#1D4ED8', fontSize: 10, flexShrink: 0 }}>✦</span>
                <span style={{ fontSize: 11, color: textMuted }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Button */}
        <button
          onClick={analyze}
          disabled={loading || !resume || (mode === 'job' && !jobDesc.trim())}
          style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#93C5FD' : '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading || !resume ? 'not-allowed' : 'pointer', opacity: !resume ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'background 0.15s' }}
        >
          {loading ? <><Spin /> Analyzing…</> : mode === 'general' ? '⚡ Get General Score' : '🎯 Score Against Job'}
        </button>

        {error && <p style={{ fontSize: 12, color: '#f87171', margin: '10px 0 0', textAlign: 'center' }}>{error}</p>}
      </div>

      {/* ── RESULTS ── */}
      {result && (
        <>
          {/* Overall score card */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
              <svg viewBox="0 0 36 36" width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={trackBg} strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor(result.overallScore)} strokeWidth="3" strokeDasharray={`${result.overallScore} 100`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: scoreText(result.overallScore) }}>{result.overallScore}</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: text }}>ATS Score</p>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: mode === 'general' ? (D ? '#374151' : '#f3f4f6') : (D ? '#172554' : '#DBEAFE'), color: mode === 'general' ? textMuted : '#1E3A8A', fontWeight: 500 }}>
                  {mode === 'general' ? 'General' : 'Job match'}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
                {result.overallScore >= 80 ? '🎉 Great! Your resume is well-optimized.' : result.overallScore >= 60 ? '👍 Good start — a few improvements will help.' : '⚠ Needs work — follow the suggestions below.'}
              </p>
              <div style={{ marginTop: 10, height: 6, borderRadius: 99, background: trackBg, width: 200, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: scoreColor(result.overallScore), width: `${result.overallScore}%`, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ ...card, padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0, color: textMuted, margin: '0 0 16px' }}>Score Breakdown</p>
            {result.breakdown && Object.entries(result.breakdown).map(([k, v]) => (
              <div key={k} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: text }}>{LABELS[k] || k}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: scoreText(v.score) }}>{v.score}/100</span>
                </div>
                <div style={{ height: 6, borderRadius: 99, background: trackBg, overflow: 'hidden', marginBottom: 5 }}>
                  <div style={{ height: '100%', borderRadius: 99, background: barColor(v.score), width: `${v.score}%`, transition: 'width 0.7s ease' }} />
                </div>
                <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{v.feedback}</p>
              </div>
            ))}
          </div>

          {/* Missing keywords — only in job mode */}
          {result.missingKeywords?.length > 0 && (
            <div style={{ border: `1px solid ${D ? '#78350f' : '#fde68a'}`, borderRadius: 16, padding: 16, marginBottom: 16, background: D ? '#1c1006' : '#fffbeb' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: D ? '#fbbf24' : '#92400e', margin: '0 0 10px' }}>⚠ Missing Keywords</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.missingKeywords.map((kw, i) => (
                  <span key={i} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: D ? '#3b1e06' : '#fef3c7', color: D ? '#fbbf24' : '#92400e', fontWeight: 500 }}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.topSuggestions?.length > 0 && (
            <div style={card}>
              <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0, color: textMuted, margin: '0 0 12px' }}>Top Suggestions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {result.topSuggestions.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 99, background: D ? '#172554' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p style={{ fontSize: 12, color: text, margin: 0, lineHeight: 1.6 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Re-analyze button */}
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={() => setResult(null)} style={{ fontSize: 12, color: textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              ← Run again
            </button>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !loading && (
        <div style={{ background: bg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>⚡</div>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: text }}>Your ATS score will appear here</p>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
            {!resume ? 'Fill in your resume details first, then run the analysis.' : 'Choose a mode above and click Analyze.'}
          </p>
        </div>
      )}
    </div>
  );
}

function Spin() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}
