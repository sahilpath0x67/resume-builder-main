'use client';
import { useState } from 'react';
import type { ResumeOutput } from '../lib/types';
import { getAIErrorMessage } from '../lib/aiErrors';
import { extractJobKeywords } from '../lib/localTemplates';

interface Props {
  resume: ResumeOutput | null;
  dark: boolean;
  onTailored: (resume: ResumeOutput) => void;
}

export default function TailorPanel({ resume, dark: D, onTailored }: Props) {
  const [jobDesc, setJobDesc]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);

  const bg        = D ? '#1f2937' : '#ffffff';
  const bgSubtle  = D ? '#111827' : '#f9fafb';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text      = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const inputBg   = D ? '#374151' : '#ffffff';

  const card: React.CSSProperties = { background: bg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: 20, marginBottom: 16 };
  const inp: React.CSSProperties  = { width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 10, border: `1px solid ${borderCol}`, background: inputBg, color: text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', resize: 'vertical' };

  const tailor = async () => {
    if (!resume) { setError('Fill in your resume details first.'); return; }
    if (!jobDesc.trim()) { setError('Please paste a job description.'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/tailor-resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume, jobDescription: jobDesc }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      onTailored(data.resume);
      setSuccess('Resume tailored! Check the Preview tab to see the changes.');
    } catch (e: unknown) {
      setError(getAIErrorMessage(e, 'Failed to tailor resume. Please try again.'));
    } finally { setLoading(false); }
  };

  const scanKeywords = () => {
    if (!resume) { setError('Fill in your resume details first.'); return; }
    if (!jobDesc.trim()) { setError('Please paste a job description.'); return; }
    const found = extractJobKeywords(jobDesc, resume);
    setKeywords(found);
    setError('');
    setSuccess(found.length ? 'Keyword scan complete.' : 'No obvious missing keywords found.');
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={card}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15, flexShrink: 0 }}>🎯</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>Tailor to Job Description</p>
            <p style={{ margin: 0, fontSize: 11, color: textMuted }}>AI rewrites your resume to match a specific job</p>
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99, background: resume ? '#DBEAFE' : D ? '#3b1e06' : '#fef3c7', color: resume ? '#1E3A8A' : D ? '#fbbf24' : '#92400e', flexShrink: 0 }}>
            {resume ? '✓ Resume ready' : '⚠ Fill resume first'}
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0 }}>What this does</p>
          {[
            'Rewrites your summary to directly address the job',
            'Reorders bullets to highlight the most relevant experience',
            'Adds missing keywords from the job description naturally',
            'Keeps all your facts accurate — nothing is invented',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#7c3aed', fontSize: 11, marginTop: 1, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 12, color: textMuted }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Job description input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: textMuted, marginBottom: 6 }}>
            Job description <span style={{ color: '#7c3aed' }}>*</span>
          </label>
          <textarea style={{ ...inp, minHeight: 140 }} rows={6} placeholder="Paste the full job description here — the more detail, the better the tailoring…" value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
          <p style={{ fontSize: 11, color: D ? '#6b7280' : '#9ca3af', margin: '5px 0 0' }}>
            💡 Tip: copy the entire job posting including requirements and responsibilities
          </p>
        </div>

        <button onClick={scanKeywords} disabled={!resume || !jobDesc.trim()} style={{ width: '100%', padding: '10px 0', borderRadius: 12, border: `1px solid ${borderCol}`, background: 'transparent', color: textMuted, fontSize: 13, fontWeight: 500, cursor: !resume || !jobDesc.trim() ? 'not-allowed' : 'pointer', opacity: !resume || !jobDesc.trim() ? 0.5 : 1, fontFamily: 'inherit', marginBottom: 12 }}>
          Scan missing keywords
        </button>

        {keywords.length > 0 && (
          <div style={{ background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0 }}>Missing keywords</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {keywords.map(keyword => (
                <span key={keyword} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: D ? '#312e81' : '#ede9fe', color: D ? '#c4b5fd' : '#6d28d9', fontWeight: 500 }}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error / success */}
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 12 }}>⚠ {error}</div>}
        {success && <div style={{ background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.2)', color: '#1D4ED8', borderRadius: 10, padding: '10px 14px', fontSize: 12, marginBottom: 12 }}>✓ {success}</div>}

        {/* Button */}
        <button onClick={tailor} disabled={loading || !resume || !jobDesc.trim()} style={{ width: '100%', padding: '11px 0', borderRadius: 12, border: 'none', background: loading ? '#6d28d9' : '#7c3aed', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading || !resume || !jobDesc.trim() ? 'not-allowed' : 'pointer', opacity: !resume || !jobDesc.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', transition: 'background 0.15s' }}>
          {loading ? <><Spin /> Tailoring your resume…</> : '🎯 Tailor resume to this job'}
        </button>
      </div>

      {/* Empty state */}
      {!resume && (
        <div style={{ background: bg, border: `1px solid ${borderCol}`, borderRadius: 16, padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>🎯</div>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: text }}>Fill in your resume first</p>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6 }}>Add your details on the left, then come back here to tailor it to any job.</p>
        </div>
      )}
    </div>
  );
}

function Spin() {
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}
