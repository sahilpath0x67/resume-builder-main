import type { ResumeOutput } from '../../lib/types';

export default function ModernTemplate({ resume, dark: D }: { resume: ResumeOutput; dark: boolean }) {
  const bg = D ? '#1f2937' : '#ffffff';
  const sidebar = D ? '#111827' : '#1E3A8A';
  const textC = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';

  return (
    <div id="resume-output" style={{
      width: '210mm', maxWidth: '100%', margin: '0 auto', background: bg, borderRadius: 10, overflow: 'hidden', boxSizing: 'border-box',
      display: 'grid', gridTemplateColumns: '64mm 1fr',
      fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.55,
      boxShadow: D ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Sidebar */}
      <div style={{ background: sidebar, padding: '14mm 8mm 12mm', color: '#fff' }}>
        {/* Avatar circle */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          {resume.name?.[0] ?? '?'}
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.25 }}>{resume.name}</h1>
        {resume.title && <p style={{ fontSize: 11.8, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>{resume.title}</p>}

        {/* Contact */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>Contact</p>
          {resume.email && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px', wordBreak: 'break-all' }}>{resume.email}</p>}
          {resume.phone && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px' }}>{resume.phone}</p>}
          {resume.location && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px' }}>{resume.location}</p>}
          {resume.linkedin && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px', wordBreak: 'break-all' }}>{resume.linkedin}</p>}
          {resume.portfolio && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px', wordBreak: 'break-all' }}>{resume.portfolio}</p>}
          {resume.github && <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: '0 0 5px', wordBreak: 'break-all' }}>{resume.github}</p>}
        </div>

        {/* Skills */}
        {resume.skills?.length > 0 && (
          <div>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>Skills</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {resume.skills.map((s, i) => (
                <span key={i} style={{ fontSize: 10.8, color: '#fff', background: 'rgba(255,255,255,0.15)', borderRadius: 4, padding: '3px 8px' }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {resume.languages?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>Languages</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {resume.languages.map((lang, i) => (
                <span key={i} style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)' }}>
                  {typeof lang === 'string' ? lang : `${lang.name}${lang.level ? ` (${lang.level})` : ''}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {resume.hobbies?.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0, color: 'rgba(255,255,255,0.55)', margin: '0 0 8px' }}>Hobbies</p>
            <p style={{ fontSize: 10.8, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.55 }}>{resume.hobbies.join(', ')}</p>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ padding: '14mm 13mm', color: textC }}>
        {resume.summary && (
          <div style={{ marginBottom: 20 }}>
            <SidebarSectionTitle>Profile</SidebarSectionTitle>
            <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: textMuted }}>{resume.summary}</p>
          </div>
        )}

        {resume.experience?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SidebarSectionTitle>Experience</SidebarSectionTitle>
            {resume.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.6, color: textC }}>{exp.role}</span>
                  <span style={{ fontSize: 11, color: textMuted }}>{exp.period}</span>
                </div>
                <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, margin: '1px 0 5px' }}>{exp.company}</p>
                {exp.bullets?.length > 0 && <ul style={{ paddingLeft: '1.2em', margin: 0 }}>{exp.bullets.map((b, j) => <li key={j} style={{ fontSize: 12.2, marginBottom: 3, color: textMuted, lineHeight: 1.5 }}>{b}</li>)}</ul>}
              </div>
            ))}
          </div>
        )}

        {resume.education?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <SidebarSectionTitle>Education</SidebarSectionTitle>
            {resume.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: textC }}>{edu.institution}</span>
                  <span style={{ fontSize: 11, color: textMuted }}>{edu.period}</span>
                </div>
                <p style={{ fontSize: 12, color: textMuted, margin: '2px 0 0', fontStyle: 'italic' }}>{edu.degree}</p>
              </div>
            ))}
          </div>
        )}

        {resume.achievements?.length > 0 && (
          <div>
            <SidebarSectionTitle>Achievements</SidebarSectionTitle>
            <ul style={{ paddingLeft: '1.2em', margin: 0 }}>
              {resume.achievements.map((a, i) => (
                <li key={i} style={{ fontSize: 12.2, marginBottom: 6, color: textMuted, lineHeight: 1.5 }}>
                  <strong style={{ color: textC }}>{a.title}</strong>
                  {(a.organization || a.date) && (
                    <span> — {[a.organization, a.date].filter(Boolean).join(' · ')}</span>
                  )}
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

function SidebarSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <div style={{ width: 3, height: 16, background: '#1D4ED8', borderRadius: 99 }} />
      <h2 style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0, color: '#1D4ED8', margin: 0 }}>{children}</h2>
    </div>
  );
}
