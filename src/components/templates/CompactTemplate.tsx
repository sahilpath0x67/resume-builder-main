import type { ResumeOutput } from '../../lib/types';

export default function CompactTemplate({ resume, dark: D }: { resume: ResumeOutput; dark: boolean }) {
  const bg        = D ? '#1f2937' : '#ffffff';
  const textC     = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const borderCol = D ? '#374151' : '#e5e7eb';

  return (
    <div id="resume-output" style={{
      width: '210mm', maxWidth: '100%', margin: '0 auto', background: bg, borderRadius: 10, boxSizing: 'border-box',
      padding: '13mm 15mm', fontFamily: 'Inter, sans-serif',
      fontSize: 13, lineHeight: 1.45, color: textC,
      boxShadow: D ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Compact header — everything on 2 lines */}
      <div style={{ borderBottom: `2px solid #059669`, paddingBottom: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: textC, margin: '0 0 2px', letterSpacing: 0 }}>{resume.name}</h1>
            {resume.title && <p style={{ fontSize: 13, color: '#059669', fontWeight: 600, margin: 0 }}>{resume.title}</p>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, fontSize: 11, color: textMuted }}>
            {resume.email    && <span>{resume.email}</span>}
            {resume.phone    && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.linkedin && <span style={{ color: '#059669' }}>{resume.linkedin}</span>}
          </div>
        </div>
      </div>

      {/* Two-column layout for most sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }}>

        {/* Left column */}
        <div>
          {resume.summary && (
            <CSection title="Summary" border={borderCol} accent="#059669">
          <p style={{ fontSize: 12.6, lineHeight: 1.6, margin: 0, color: textMuted }}>{resume.summary}</p>
            </CSection>
          )}

          {resume.experience?.length > 0 && (
            <CSection title="Experience" border={borderCol} accent="#059669">
              {resume.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 12 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: textC }}>{exp.company}</span>
                    <span style={{ fontSize: 10.8, color: textMuted }}>{exp.period}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#059669', fontWeight: 600, margin: '1px 0 4px', fontStyle: 'italic' }}>{exp.role}</p>
                  {exp.bullets?.length > 0 && (
                    <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                      {exp.bullets.map((b, j) => <li key={j} style={{ fontSize: 12, marginBottom: 2, color: textMuted, lineHeight: 1.5 }}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </CSection>
          )}
        </div>

        {/* Right column */}
        <div>
          {resume.skills?.length > 0 && (
            <CSection title="Skills" border={borderCol} accent="#059669">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {resume.skills.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#059669', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.8, color: textMuted }}>{s}</span>
                  </div>
                ))}
              </div>
            </CSection>
          )}

          {resume.education?.length > 0 && (
            <CSection title="Education" border={borderCol} accent="#059669">
              {resume.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 12, color: textC, margin: '0 0 1px' }}>{edu.institution}</p>
                  <p style={{ fontSize: 11, color: textMuted, fontStyle: 'italic', margin: '0 0 1px' }}>{edu.degree}</p>
                  <p style={{ fontSize: 10.8, color: textMuted, margin: 0 }}>{edu.period}</p>
                </div>
              ))}
            </CSection>
          )}

          {resume.languages?.length > 0 && (
            <CSection title="Languages" border={borderCol} accent="#059669">
              <p style={{ fontSize: 11.5, color: textMuted, margin: 0, lineHeight: 1.55 }}>{resume.languages.join(', ')}</p>
            </CSection>
          )}

          {resume.hobbies?.length > 0 && (
            <CSection title="Hobbies" border={borderCol} accent="#059669">
              <p style={{ fontSize: 11.5, color: textMuted, margin: 0, lineHeight: 1.55 }}>{resume.hobbies.join(', ')}</p>
            </CSection>
          )}

          {resume.achievements?.length > 0 && (
            <CSection title="Achievements" border={borderCol} accent="#059669">
              <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                {resume.achievements.map((a, i) => (
                  <li key={i} style={{ fontSize: 11.5, marginBottom: 5, color: textMuted, lineHeight: 1.5 }}>
                    <strong style={{ color: textC }}>{a.title}</strong>
                    {(a.organization || a.date) && <span> — {[a.organization, a.date].filter(Boolean).join(' · ')}</span>}
                    {a.description && <div style={{ marginTop: 2 }}>{a.description}</div>}
                  </li>
                ))}
              </ul>
            </CSection>
          )}
        </div>
      </div>
    </div>
  );
}

function CSection({ title, children, border, accent }: { title: string; children: React.ReactNode; border: string; accent: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 10.8, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase', color: accent, margin: '0 0 6px', paddingBottom: 3, borderBottom: `1px solid ${border}` }}>{title}</h2>
      {children}
    </div>
  );
}
             