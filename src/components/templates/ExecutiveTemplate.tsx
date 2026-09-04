import type { ResumeOutput } from '../../lib/types';

export default function ExecutiveTemplate({ resume, dark: D }: { resume: ResumeOutput; dark: boolean }) {
  const bg        = D ? '#1f2937' : '#ffffff';
  const textC     = D ? '#f3f4f6' : '#1a1a2e';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const accentBg  = D ? '#1e1b4b' : '#1a1a2e';

  return (
    <div id="resume-output" style={{
      width: '210mm', maxWidth: '100%', margin: '0 auto', background: bg, borderRadius: 10, boxSizing: 'border-box',
      fontFamily: 'Georgia, serif', fontSize: 14, lineHeight: 1.55, color: textC,
      boxShadow: D ? '0 1px 3px rgba(0,0,0,0.4)' : '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Navy header band */}
      <div style={{ background: accentBg, padding: '14mm 16mm 12mm' }}>
        <h1 style={{ fontSize: 32, fontWeight: 400, color: '#fff', margin: '0 0 4px', letterSpacing: 0, fontFamily: 'Georgia, serif' }}>{resume.name}</h1>
        {resume.title && <p style={{ fontSize: 14, color: '#a5b4fc', margin: '0 0 16px', fontStyle: 'italic' }}>{resume.title}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter, sans-serif' }}>
          {resume.email    && <span>✉ {resume.email}</span>}
          {resume.phone    && <span>📞 {resume.phone}</span>}
          {resume.location && <span>📍 {resume.location}</span>}
          {resume.linkedin && <span>🔗 {resume.linkedin}</span>}
        </div>
      </div>

      {/* Gold rule */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)' }} />

      {/* Body */}
      <div style={{ padding: '14mm 16mm' }}>
        {resume.summary && (
          <ExecSection title="Executive Summary" border={borderCol}>
            <p style={{ fontSize: 13.3, lineHeight: 1.65, margin: 0, color: textMuted, fontStyle: 'italic' }}>{resume.summary}</p>
          </ExecSection>
        )}

        {resume.experience?.length > 0 && (
          <ExecSection title="Professional Experience" border={borderCol}>
            {resume.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 18 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14.4, color: textC, fontFamily: 'Inter, sans-serif' }}>{exp.role}</span>
                    <span style={{ fontSize: 12.5, color: '#f59e0b', fontFamily: 'Inter, sans-serif', marginLeft: 8, fontWeight: 600 }}>@ {exp.company}</span>
                  </div>
                  <span style={{ fontSize: 11.5, color: textMuted, fontFamily: 'Inter, sans-serif', background: D ? '#374151' : '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{exp.period}</span>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul style={{ paddingLeft: '1.3em', margin: '8px 0 0' }}>
                    {exp.bullets.map((b, j) => <li key={j} style={{ fontSize: 13, marginBottom: 4, color: textMuted, lineHeight: 1.5 }}>{b}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </ExecSection>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {resume.education?.length > 0 && (
            <ExecSection title="Education" border={borderCol}>
              {resume.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: textC, fontFamily: 'Inter, sans-serif', margin: '0 0 2px' }}>{edu.institution}</p>
                  <p style={{ fontSize: 12, color: textMuted, fontStyle: 'italic', margin: '0 0 2px' }}>{edu.degree}</p>
                  <p style={{ fontSize: 10.8, color: textMuted, margin: 0 }}>{edu.period}</p>
                </div>
              ))}
            </ExecSection>
          )}

          {resume.skills?.length > 0 && (
            <ExecSection title="Core Competencies" border={borderCol}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {resume.skills.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: textMuted, fontFamily: 'Inter, sans-serif' }}>{s}</span>
                  </div>
                ))}
              </div>
            </ExecSection>
          )}
        </div>

        {(resume.languages?.length > 0 || resume.hobbies?.length > 0) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {resume.languages?.length > 0 && (
              <ExecSection title="Languages" border={borderCol}>
                <p style={{ fontSize: 12.2, color: textMuted, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.55 }}>{resume.languages.join(', ')}</p>
              </ExecSection>
            )}

            {resume.hobbies?.length > 0 && (
              <ExecSection title="Hobbies" border={borderCol}>
                <p style={{ fontSize: 12.2, color: textMuted, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.55 }}>{resume.hobbies.join(', ')}</p>
              </ExecSection>
            )}
          </div>
        )}

        {resume.achievements?.length > 0 && (
          <ExecSection title="Awards & Certifications" border={borderCol}>
            <ul style={{ paddingLeft: '1.3em', margin: 0 }}>
              {resume.achievements.map((a, i) => (
                <li key={i} style={{ fontSize: 13, marginBottom: 6, color: textMuted, lineHeight: 1.5 }}>
                  <strong style={{ color: textC }}>{a.title}</strong>
                  {(a.organization || a.date) && <span> — {[a.organization, a.date].filter(Boolean).join(' · ')}</span>}
                  {a.description && <div style={{ marginTop: 2 }}>{a.description}</div>}
                </li>
              ))}
            </ul>
          </ExecSection>
        )}
      </div>
    </div>
  );
}

function ExecSection({ title, children, border }: { title: string; children: React.ReactNode; border: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h2 style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0, textTransform: 'uppercase', color: '#f59e0b', fontFamily: 'Inter, sans-serif', margin: 0 }}>{title}</h2>
        <div style={{ flex: 1, height: 1, background: border }} />
      </div>
      {children}
    </div>
  );
}
