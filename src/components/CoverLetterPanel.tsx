'use client';
import { useState } from 'react';
import type { ResumeOutput } from '../lib/types';
import { buildCoverLetterDraft } from '../lib/localTemplates';

interface Props {
  coverLetter: string;
  resume: ResumeOutput | null;
  jobDesc: string;
  setJobDesc: (v: string) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  hiringManager: string;
  setHiringManager: (v: string) => void;
  onGenerate: () => void;
  onUseDraft: (text: string) => void;
  loading: boolean;
  dark: boolean;
}

type Tone = 'professional' | 'enthusiastic' | 'concise';

const TONES: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professional', desc: 'Formal & polished' },
  { value: 'enthusiastic', label: 'Enthusiastic', desc: 'Warm & energetic' },
  { value: 'concise', label: 'Concise', desc: 'Short & punchy' },
];

export default function CoverLetterPanel({
  coverLetter, resume, jobDesc, setJobDesc,
  companyName, setCompanyName, hiringManager, setHiringManager,
  onGenerate, onUseDraft, loading, dark: D,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<Tone>('professional');

  const copy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([coverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName || 'cover'}_letter.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const words = (coverLetter ?? '').trim() ? (coverLetter ?? '').trim().split(/\s+/).length : 0;
  const hasJobDesc = (jobDesc ?? '').trim().length > 0;

  const useTemplateDraft = () => {
    if (!resume) return;
    onUseDraft(buildCoverLetterDraft(resume, companyName, hiringManager, jobDesc));
  };

  // ── Color tokens ──
  const bg        = D ? '#1f2937' : '#ffffff';
  const bgSubtle  = D ? '#111827' : '#f9fafb';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text      = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const textDim   = D ? '#6b7280' : '#9ca3af';
  const inputBg   = D ? '#374151' : '#ffffff';

  const cardStyle: React.CSSProperties = {
    background: bg,
    border: `1px solid ${borderCol}`,
    borderRadius: 16,
    minWidth: 0,
    padding: 20,
    marginBottom: 16,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 13,
    borderRadius: 10,
    border: `1px solid ${borderCol}`,
    background: inputBg,
    color: text,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: textMuted,
    marginBottom: 6,
  };

  const smallBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    padding: '6px 12px',
    borderRadius: 8,
    border: `1px solid ${borderCol}`,
    background: 'transparent',
    color: textMuted,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s',
  };

  return (
    <div className="cover-letter-panel" style={{ maxWidth: 680, margin: '0 auto', width: '100%' }}>

      {/* ── CONFIG CARD ── */}
      <div style={cardStyle}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#1D4ED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 14, flexShrink: 0,
          }}>✉</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text }}>
              Cover Letter Generator
            </p>
            <p style={{ margin: 0, fontSize: 11, color: textMuted }}>
              Template draft or AI-tailored letter
            </p>
          </div>
          {/* Resume status badge */}
          <div style={{
            fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 99,
            background: resume ? '#DBEAFE' : D ? '#3b1e06' : '#fef3c7',
            color: resume ? '#1E3A8A' : D ? '#fbbf24' : '#92400e',
            flexShrink: 0,
          }}>
            {resume ? '✓ Resume ready' : '⚠ Fill resume first'}
          </div>
        </div>

        {/* Company + Hiring manager */}
        <div className="cover-letter-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>
              Company name <span style={{ color: '#1D4ED8' }}>*</span>
            </label>
            <input
              style={inputStyle}
              placeholder="Google"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Hiring manager</label>
            <input
              style={inputStyle}
              placeholder="Sarah Johnson (optional)"
              value={hiringManager}
              onChange={e => setHiringManager(e.target.value)}
            />
          </div>
        </div>

        {/* Tone selector */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Tone</label>
          <div className="cover-letter-tone-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {TONES.map(opt => {
              const active = tone === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTone(opt.value)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: `1.5px solid ${active ? '#1D4ED8' : borderCol}`,
                    background: active ? (D ? '#172554' : '#EFF6FF') : inputBg,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    fontSize: 12, fontWeight: 600,
                    color: active ? '#1D4ED8' : text,
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Job description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Job description</label>
            {hasJobDesc && (
              <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 500 }}>
                ✓ Will be used for tailoring
              </span>
            )}
          </div>
          <textarea
            style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }}
            rows={4}
            placeholder="Paste the job description here for a highly tailored letter…"
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
          />
          {!hasJobDesc && (
            <p style={{ fontSize: 11, color: textDim, margin: '6px 0 0' }}>
              💡 Adding a job description makes the letter 3× more relevant
            </p>
          )}
        </div>

        {/* Generate buttons */}
        <div className="cover-letter-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={useTemplateDraft}
            disabled={!resume}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 12,
              border: `1px solid rgba(29,78,216,0.45)`,
              background: 'transparent',
              color: '#1D4ED8',
              fontSize: 13,
              fontWeight: 500,
              cursor: !resume ? 'not-allowed' : 'pointer',
              opacity: !resume ? 0.5 : 1,
              fontFamily: 'inherit',
            }}
          >
            Use template draft
          </button>
          <button
            onClick={onGenerate}
            disabled={loading || !resume}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#93C5FD' : '#1D4ED8',
              color: '#fff',
              fontSize: 13,
              fontWeight: 500,
              cursor: loading || !resume ? 'not-allowed' : 'pointer',
              opacity: !resume ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
          >
            {loading ? (
              <><Spin /> Writing…</>
            ) : coverLetter ? (
              <>✦ Enhance with AI</>
            ) : (
              <>✦ Write with AI</>
            )}
          </button>
        </div>
      </div>

      {/* ── RESULT CARD ── */}
      {coverLetter ? (
        <div style={{
          background: bg,
          border: `1px solid ${borderCol}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Toolbar */}
          <div className="cover-letter-result-toolbar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom: `1px solid ${borderSub}`,
            background: bgSubtle,
          }}>
            <div className="cover-letter-meta" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0,
                color: textMuted,
              }}>
                Cover Letter
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: D ? '#374151' : '#f3f4f6', color: textMuted,
              }}>
                {words} words
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: D ? '#172554' : '#DBEAFE', color: '#1E3A8A',
                textTransform: 'capitalize',
              }}>
                {tone}
              </span>
            </div>
            <div className="cover-letter-result-actions" style={{ display: 'flex', gap: 6 }}>
              <button onClick={downloadTxt} style={smallBtnStyle}>
                ↓ .txt
              </button>
              <button
                onClick={copy}
                style={{
                  ...smallBtnStyle,
                  background: copied ? (D ? '#172554' : '#EFF6FF') : 'transparent',
                  borderColor: copied ? '#1D4ED8' : borderCol,
                  color: copied ? '#1D4ED8' : textMuted,
                }}
              >
                {copied ? '✓ Copied!' : '⧉ Copy'}
              </button>
            </div>
          </div>

          {/* Letter body */}
          <div style={{ padding: '32px 36px' }}>
            <div style={{
              width: 48, height: 3, borderRadius: 99,
              background: '#1D4ED8', marginBottom: 24,
            }} />
            <div style={{
              fontSize: 13.5,
              lineHeight: 1.85,
              color: text,
              whiteSpace: 'pre-wrap',
              fontFamily: 'Georgia, "Times New Roman", serif',
              letterSpacing: 0,
            }}>
              {coverLetter}
            </div>
            <div style={{
              marginTop: 28,
              paddingTop: 16,
              borderTop: `1px solid ${borderSub}`,
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: textDim }}>Generated with AI Resume Builder</span>
              <span style={{ fontSize: 11, color: textDim }}>{coverLetter.length} characters</span>
            </div>
          </div>
        </div>
      ) : (
        /* ── EMPTY STATE ── */
        <div style={{
          background: bg,
          border: `1px solid ${borderCol}`,
          borderRadius: 16,
          padding: '48px 32px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: '#DBEAFE',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round">
              <path d="M21 15.5v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: text }}>
            Your cover letter will appear here
          </p>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
            {!resume
              ? 'First fill in your resume details on the left, then come back here.'
              : 'Fill in the company name above and click Generate.'}
          </p>

          {resume && (
            <div style={{
              marginTop: 24,
              textAlign: 'left',
              border: `1px solid ${borderSub}`,
              borderRadius: 12,
              padding: 16,
              background: bgSubtle,
            }}>
              <p style={{
                margin: '0 0 10px', fontSize: 11, fontWeight: 600,
                color: textMuted, textTransform: 'uppercase', letterSpacing: 0,
              }}>
                Tips for a great letter
              </p>
              {[
                'Paste the job description for maximum relevance',
                "Add the hiring manager's name for a personal touch",
                'Choose your tone to match the company culture',
              ].map(tip => (
                <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span style={{ color: '#1D4ED8', fontSize: 11, marginTop: 1, flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 12, color: textMuted }}>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spin() {
  return (
    <span style={{
      display: 'inline-block',
      width: 14, height: 14,
      borderRadius: '50%',
      border: '2px solid rgba(255,255,255,0.3)',
      borderTopColor: '#fff',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  );
}
