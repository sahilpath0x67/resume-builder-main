import type { ResumeOutput } from '../../lib/types';

export default function BoldTemplate({ resume, dark: D }: { resume: ResumeOutput; dark: boolean }) {
  const bg        = D ? '#1f2937' : '#ffffff';
  const textC     = D ? '#f3f4f6' : '#0f172a';
  const textMuted = D ? '#9ca3af' : '#64748b';
  const borderCol = D ? '#374151' : '#f1f5f9';

  return (
    <div id="resume-output" style={{
      width: '210mm', maxWidth: '100%', margin: '0 auto', background: bg, borderRadius: 10, boxSizing: 'border-box',
      fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5, color: textC,
      boxShadow: D ? '0 1px 3px rgba(0,0,0,0.4)' : '0 2px 16px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Bold full-width header */}
      <div style={{ background: D ? '#111827' : '#0f172a', padding: '14mm 16mm' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', margin: '0 0 4px', letterSpacing: 0, lineHeight: 1.1 }}>{resume.name}</h1>
            {resume.title && (
              <div style={{ display: 'inline-block', background: '#e11d48', padding: '3px 12px', borderRadius: 4, marginTop: 6 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', margin: 0, textTransform: 'uppercase', letterSpacing: 0 }}>{resume.title}</p>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11.5, color: 'rgba(255,255,255,0.6)', textAlign: 'right' }}>
            {resume.email    && <span>{resume.email}</span>}
            {resume.phone    && <span>{resume.phone}</span>}
            {resume.location && <span>{resume.location}</span>}
            {resume.linkedin && <span style={{ color: '#fb7185' }}>{resume.linkedin}</span>}
          </div>
        </div>
      </div>

      {/* Red accent bar */}
      <div style={{ height: 4, background: '#e11d48' }} />

      {/* Body */}
      <div style={{ padding: '14mm 16mm' }}>
        {resume.summary && (
          <div style={{ marginBottom: 24 }}>
            <BoldSection title="About" accent="#e11d48" border={borderCol} />
            <p style={{ fontSize: 13.3, lineHeight: 1.6, margin: '10px 0 0', color: textMuted }}>{resume.summary}</p>
          </div>
        )}

        {resume.experience?.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <BoldSection title="Experience" accent="#e11d48" border={borderCol} />
            <div style={{ marginTop: 10 }}>
              {resume.experience.map((exp, i) => (
                <div key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 18 : 0, paddingBottom: i < resume.experience.length - 1 ? 18 : 0, borderBottom: i < resume.experience.length - 1 ? `1px dashed ${borderCol}` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14.5, color: textC }}>{exp.role}</span>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#e11d48', background: D ? '#2d1520' : '#fff1f2', padding: '2px 10px', borderRadius: 4 }}>{exp.period}</span>
                  </div>
                  <p style={{ fontSize: 13, color: textMuted, fontWeight: 600, margin: '0 0 6px' }}>{exp.company}</p>
                  {exp.bullets?.length > 0 && (
                    <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
                      {exp.bullets.map((b, j) => <li key={j} style={{ fontSize: 13, marginBottom: 4, color: textMuted, lineHeight: 1.5 }}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {resume.education?.length > 0 && (
            <div>
              <BoldSection title="Education" accent="#e11d48" border={borderCol} />
              <div style={{ marginTop: 10 }}>
                {resume.education.map((edu, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <p style={{ fontWeight: 700, fontSize: 13, color: textC, margin: '0 0 1px' }}>{edu.institution}</p>
                    <p style={{ fontSize: 12, color: textMuted, fontStyle: 'italic', margin: '0 0 1px' }}>{edu.degree}</p>
                    <p style={{ fontSize: 10.8, color: textMuted, margin: 0 }}>{edu.period}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resume.skills?.length > 0 && (
            <div>
              <BoldSection title="Skills" accent="#e11d48" border={borderCol} />
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {resume.skills.map((s, i) => (
                  <span key={i} style={{ fontSize: 11.5, padding: '3px 10px', borderRadius: 4, background: D ? '#374151' : '#f8fafc', color: textMuted, border: `1px solid ${borderCol}`, fontWeight: 500 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {(resume.languages?.length > 0 || resume.hobbies?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
            {resume.languages?.length > 0 && (
              <div>
                <BoldSection title="Languages" accent="#e11d48" border={borderCol} />
                <p style={{ margin: '10px 0 0', fontSize: 12.5, color: textMuted, lineHeight: 1.55 }}>{resume.languages.join(', ')}</p>
              </div>
            )}

            {resume.hobbies?.length > 0 && (
              <div>
                <BoldSection title="Hobbies" accent="#e11d48" border={borderCol} />
                <p style={{ margin: '10px 0 0', fontSize: 12.5, color: textMuted, lineHeight: 1.55 }}>{resume.hobbies.join(', ')}</p>
              </div>
            )}
          </div>
        )}

        {resume.achievements?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <BoldSection title="Achievements" accent="#e11d48" border={borderCol} />
            <ul style={{ paddingLeft: '1.2em', margin: '10px 0 0' }}>
              {resume.achievements.map((a, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 6, color: textMuted, lineHeight: 1.5 }}>
                  <strong style={{ color: textC }}>{a.title}</strong>
                  {(a.organization || a.date) && <span> — {[a.organization, a.date].filter(Boolean).join(' · ')}</span>}
                  {a.description && <div style={{ marginTop: 2 }}>{a.description}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function BoldSection({ title, accent, border }: { title: string; accent: string; border: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <h2 style={{ fontSize: 13, fontWeight: 900, color: accent, margin: 0, textTransform: 'uppercase', letterSpacing: 0 }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: border }} />
    </div>
  );
}
