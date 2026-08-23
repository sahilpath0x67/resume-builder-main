'use client';
import type { ResumeOutput } from '../lib/types';
import { analyzeResume, type InsightSection } from '../lib/resumeInsights';

interface Props {
  resume: ResumeOutput | null;
  dark: boolean;
  onFocusSection: (section: InsightSection) => void;
  onOpenAts: () => void;
  onOpenTailor: () => void;
}

const sectionLabel: Record<InsightSection, string> = {
  basics: 'Basics',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  ats: 'ATS',
};

const severityColor = {
  high: '#f87171',
  medium: '#fbbf24',
  low: '#60a5fa',
};

export default function ResumeCoachPanel({ resume, dark: D, onFocusSection, onOpenAts, onOpenTailor }: Props) {
  const insights = analyzeResume(resume);

  const bg = D ? '#1f2937' : '#ffffff';
  const bgSubtle = D ? '#111827' : '#f9fafb';
  const border = D ? '#374151' : '#e5e7eb';
  const borderSub = D ? '#1f2937' : '#f3f4f6';
  const text = D ? '#f3f4f6' : '#111827';
  const muted = D ? '#9ca3af' : '#6b7280';
  const dim = D ? '#6b7280' : '#9ca3af';
  const scoreColor = insights.score >= 80 ? '#4ade80' : insights.score >= 60 ? '#fbbf24' : '#f87171';
  const fitColor = insights.a4Fit.status === 'balanced' ? '#1D4ED8' : insights.a4Fit.status === 'dense' ? '#f59e0b' : '#f87171';

  const card: React.CSSProperties = {
    background: bg,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ ...card, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 22, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 112, height: 112 }}>
          <svg viewBox="0 0 36 36" width="112" height="112" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={D ? '#374151' : '#f3f4f6'} strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={scoreColor} strokeWidth="3" strokeDasharray={`${insights.score} 100`} strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: scoreColor }}>{insights.score}</span>
            <span style={{ fontSize: 10, color: muted, fontWeight: 600 }}>READY</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: 18, color: text }}>Resume Coach</h2>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99, background: insights.exportReady ? 'rgba(29,78,216,0.14)' : 'rgba(251,191,36,0.14)', color: insights.exportReady ? '#1D4ED8' : '#d97706', fontWeight: 700 }}>
              {insights.exportReady ? 'Export ready' : 'Needs review'}
            </span>
          </div>
          <p style={{ margin: '0 0 14px', color: muted, fontSize: 13, lineHeight: 1.6 }}>
            Local, no-AI review for recruiter readiness, ATS basics, and export risk.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {[
              ['Completion', `${insights.completion}%`],
              ['Words', String(insights.words)],
              ['A4 fit', insights.a4Fit.label],
              ['Issues', String(insights.issues.length)],
            ].map(([label, value]) => (
              <div key={label} style={{ background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 10, padding: '10px 12px' }}>
                <p style={{ margin: 0, color: dim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>{label}</p>
                <p style={{ margin: '3px 0 0', color: text, fontSize: 16, fontWeight: 700 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <p style={{ margin: 0, color: text, fontSize: 14, fontWeight: 800 }}>A4 Page Fit</p>
          <span style={{ fontSize: 11, fontWeight: 800, color: fitColor }}>{insights.a4Fit.score}% {insights.a4Fit.label}</span>
        </div>
        <div style={{ height: 8, background: bgSubtle, borderRadius: 99, overflow: 'hidden', border: `1px solid ${borderSub}` }}>
          <div style={{ width: `${insights.a4Fit.score}%`, height: '100%', background: fitColor, borderRadius: 99 }} />
        </div>
        <p style={{ margin: '10px 0 0', color: muted, fontSize: 12.5, lineHeight: 1.55 }}>{insights.a4Fit.detail}</p>
      </div>

      {insights.issues.length > 0 ? (
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Next best actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {insights.issues.slice(0, 6).map(issue => (
              <div key={issue.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'start', background: bgSubtle, border: `1px solid ${borderSub}`, borderRadius: 12, padding: '12px 14px' }}>
                <span style={{ width: 9, height: 9, marginTop: 5, borderRadius: 99, background: severityColor[issue.severity] }} />
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <p style={{ margin: 0, color: text, fontSize: 13, fontWeight: 700 }}>{issue.title}</p>
                    <span style={{ color: dim, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>{sectionLabel[issue.section]}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', color: muted, fontSize: 12, lineHeight: 1.5 }}>{issue.detail}</p>
                </div>
                <button onClick={() => onFocusSection(issue.section)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: '#1D4ED8', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                  {issue.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={card}>
          <p style={{ margin: 0, color: '#1D4ED8', fontSize: 14, fontWeight: 700 }}>No major local issues found.</p>
          <p style={{ margin: '6px 0 0', color: muted, fontSize: 12 }}>Run a job-specific ATS scan if you want to match a particular role.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Strengths</p>
          {insights.strengths.length > 0 ? insights.strengths.map(strength => (
            <div key={strength} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ color: '#1D4ED8', fontSize: 12, marginTop: 1 }}>✓</span>
              <span style={{ color: text, fontSize: 12, lineHeight: 1.5 }}>{strength}</span>
            </div>
          )) : (
            <p style={{ margin: 0, color: muted, fontSize: 12, lineHeight: 1.6 }}>Add more resume content to unlock strengths.</p>
          )}
        </div>

        <div style={card}>
          <p style={{ margin: '0 0 12px', fontSize: 11, color: muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>Power tools</p>
          <button onClick={onOpenAts} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: 'none', background: '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8 }}>
            Run ATS score
          </button>
          <button onClick={onOpenTailor} style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Match a job post
          </button>
        </div>
      </div>
    </div>
  );
}
