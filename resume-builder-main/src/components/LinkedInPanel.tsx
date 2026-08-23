'use client';
import { useState } from 'react';
import type { ResumeOutput } from '../lib/types';
import { getAIErrorMessage } from '../lib/aiErrors';
import { buildLinkedInAboutDraft } from '../lib/localTemplates';

export default function LinkedInPanel({
  resume,
  dark: D,
}: {
  resume: ResumeOutput | null;
  dark: boolean;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!resume) { setError('Fill in your resume details first.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/linkedin-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setText(data.linkedin ?? '');
    } catch (e: unknown) {
      setError(getAIErrorMessage(e, 'Failed to generate. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const useTemplateDraft = () => {
    if (!resume) { setError('Fill in your resume details first.'); return; }
    setError('');
    setText(buildLinkedInAboutDraft(resume));
  };

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const words = text?.trim() ? text.trim().split(/\s+/).length : 0;
  // ── Color tokens ──
  const bg = D ? '#1f2937' : '#ffffff';
  const bgSubtle = D ? '#111827' : '#f9fafb';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text_c = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const textDim = D ? '#6b7280' : '#9ca3af';
  const inputBg = D ? '#374151' : '#f9fafb';

  const cardStyle: React.CSSProperties = {
    background: bg,
    border: `1px solid ${borderCol}`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── CONFIG CARD ── */}
      <div style={cardStyle}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          {/* LinkedIn logo mark */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#0A66C2',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: text_c }}>
              LinkedIn About Section
            </p>
            <p style={{ margin: 0, fontSize: 11, color: textMuted }}>
              Template draft or AI-written About
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

        {/* What you get */}
        <div style={{
          background: bgSubtle,
          border: `1px solid ${borderSub}`,
          borderRadius: 10,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: 0 }}>
            What you&apos;ll get
          </p>
          {[
            'Written in first person, like you wrote it',
            'Highlights your top skills and experience',
            'Optimized for LinkedIn search (keywords included)',
            'Under 2,600 characters — LinkedIn\'s limit',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#0A66C2', fontSize: 11, marginTop: 1, flexShrink: 0 }}>✦</span>
              <span style={{ fontSize: 12, color: textMuted }}>{item}</span>
            </div>
          ))}
        </div>

        {/* Generate buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={useTemplateDraft}
            disabled={!resume}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 12,
              border: `1px solid ${borderCol}`,
              background: 'transparent',
              color: '#0A66C2',
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
            onClick={generate}
            disabled={loading || !resume}
            style={{
              width: '100%',
              padding: '11px 0',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#1d4ed8' : '#0A66C2',
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
            ) : text ? (
              <>✦ Enhance with AI</>
            ) : (
              <>✦ Write with AI</>
            )}
          </button>
        </div>

        {error && (
          <p style={{ fontSize: 12, color: '#f87171', margin: '10px 0 0', textAlign: 'center' }}>
            {error}
          </p>
        )}
      </div>

      {/* ── RESULT CARD ── */}
      {text ? (
        <div style={{
          background: bg,
          border: `1px solid ${borderCol}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 20px',
            borderBottom: `1px solid ${borderSub}`,
            background: bgSubtle,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 11, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: 0,
                color: textMuted,
              }}>
                Your LinkedIn About
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: D ? '#374151' : '#f3f4f6', color: textMuted,
              }}>
                {words} words
              </span>
              <span style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: D ? '#1e3a5f' : '#dbeafe', color: '#1d4ed8',
              }}>
                {text.length} / 2600 chars
              </span>
            </div>
            <button
              onClick={copy}
              style={{
                ...smallBtnStyle,
                background: copied ? (D ? '#1e3a5f' : '#eff6ff') : 'transparent',
                borderColor: copied ? '#0A66C2' : borderCol,
                color: copied ? '#0A66C2' : textMuted,
              }}
            >
              {copied ? '✓ Copied!' : '⧉ Copy'}
            </button>
          </div>

          {/* Content */}
          <div style={{ padding: '28px 28px 20px' }}>
            {/* LinkedIn-style preview */}
            <div style={{
              background: inputBg,
              border: `1px solid ${borderCol}`,
              borderRadius: 12,
              padding: '16px 18px',
              marginBottom: 16,
            }}>
              {/* Fake LinkedIn header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: `1px solid ${borderSub}` }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#0A66C2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                }}>
                  {resume?.name?.[0] ?? 'Y'}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: text_c }}>
                    {resume?.name ?? 'Your Name'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: textMuted }}>
                    {resume?.title ?? 'Your Title'}
                  </p>
                </div>
                <div style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 600,
                  color: '#0A66C2', padding: '3px 8px',
                  border: '1px solid #0A66C2', borderRadius: 99,
                }}>
                  LinkedIn
                </div>
              </div>

              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 600, color: textMuted }}>About</p>
              <div style={{
                fontSize: 13,
                lineHeight: 1.7,
                color: text_c,
                whiteSpace: 'pre-wrap',
              }}>
                {text}
              </div>
            </div>

            {/* Paste tip */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: D ? '#1e3a5f' : '#eff6ff',
              border: `1px solid ${D ? '#1d4ed8' : '#bfdbfe'}`,
              borderRadius: 10, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>💡</span>
              <p style={{ margin: 0, fontSize: 12, color: D ? '#93c5fd' : '#1d4ed8', lineHeight: 1.5 }}>
                <strong>How to add this:</strong> Go to your LinkedIn profile → click the pencil ✏ icon → scroll to <em>About</em> → paste and save.
              </p>
            </div>

            <div style={{
              marginTop: 14, paddingTop: 14,
              borderTop: `1px solid ${borderSub}`,
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 11, color: textDim }}>Generated with AI Resume Builder</span>
              <span style={{
                fontSize: 11,
                color: text.length > 2600 ? '#f87171' : textDim,
                fontWeight: text.length > 2600 ? 600 : 400,
              }}>
                {text.length > 2600
                  ? `⚠ ${text.length - 2600} chars over LinkedIn limit`
                  : `${2600 - text.length} chars remaining`}
              </span>
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
            width: 56, height: 56, borderRadius: 14, background: '#dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect x="2" y="9" width="4" height="12" />
              <circle cx="4" cy="4" r="2" />
            </svg>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 500, color: text_c }}>
            Your LinkedIn About will appear here
          </p>
          <p style={{ margin: 0, fontSize: 13, color: textMuted, lineHeight: 1.6 }}>
            {!resume
              ? 'Fill in your resume details first, then come back here.'
              : 'Click Generate above to create your About section.'}
          </p>
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
