import type { ResumeOutput } from '../lib/types';

export default function ResumePreview({
  resume,
  dark: D,
}: {
  resume: ResumeOutput;
  dark: boolean;
}) {
  const bg        = D ? '#1f2937' : '#ffffff';
  const text      = D ? '#f3f4f6' : '#111827';
  const textMuted = D ? '#9ca3af' : '#6b7280';
  const borderCol = D ? '#374151' : '#e5e7eb';
  const skillBg   = D ? '#172554' : '#DBEAFE';
  const skillText = D ? '#BFDBFE' : '#1E3A8A';

  return (
    <div
      id="resume-output"
      style={{
        width: '210mm',
        maxWidth: '100%',
        margin: '0 auto',
        background: bg,
        borderRadius: 10,
        boxSizing: 'border-box',
        padding: '16mm 18mm',
        boxShadow: D
          ? '0 1px 3px rgba(0,0,0,0.4)'
          : '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        fontFamily: 'Georgia, "Times New Roman", serif',
        fontSize: 14.2,
        lineHeight: 1.55,
        color: text,
      }}
    >
      {/* ── HEADER ── */}
      <div style={{ marginBottom: 22 }}>
        <h1 style={{
          fontSize: 30, fontWeight: 700,
          fontFamily: 'Inter, -apple-system, sans-serif',
          color: text, margin: '0 0 3px',
        }}>
          {resume.name}
        </h1>

        {resume.title && (
          <p style={{
            fontSize: 14, fontWeight: 600, color: '#1D4ED8',
            fontFamily: 'Inter, -apple-system, sans-serif',
            margin: '0 0 8px',
          }}>
            {resume.title}
          </p>
        )}

        {/* Contact row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px 16px',
          fontSize: 12, color: textMuted,
          fontFamily: 'Inter, -apple-system, sans-serif',
        }}>
          {resume.email    && <span>✉ {resume.email}</span>}
          {resume.phone    && <span>📞 {resume.phone}</span>}
          {resume.location && <span>📍 {resume.location}</span>}
          {resume.linkedin && (
            <span style={{ color: '#1D4ED8' }}>🔗 {resume.linkedin}</span>
          )}
          {/* Fallback: top-level fields (older API shape) */}
          {!resume.email    && resume.email    && <span>✉ {resume.email}</span>}
          {!resume.phone    && resume.phone    && <span>📞 {resume.phone}</span>}
          {!resume.location && resume.location && <span>📍 {resume.location}</span>}
          {!resume.linkedin && resume.linkedin && (
            <span style={{ color: '#1D4ED8' }}>🔗 {resume.linkedin}</span>
          )}
        </div>

        {/* Accent rule */}
        <div style={{ height: 2, background: '#1D4ED8', marginTop: 14, borderRadius: 1 }} />
      </div>

      {/* ── SUMMARY ── */}
      {resume.summary && (
        <Section title="Professional Summary" borderColor={borderCol}>
          <p style={{ fontSize: 13.3, lineHeight: 1.65, margin: 0, color: text }}>
            {resume.summary}
          </p>
        </Section>
      )}

      {/* ── EXPERIENCE ── */}
      {resume.experience?.length > 0 && (
        <Section title="Experience" borderColor={borderCol}>
          {resume.experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: i < resume.experience.length - 1 ? 16 : 0 }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 2,
              }}>
                <span style={{
                  fontWeight: 700, fontSize: 14,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: text,
                }}>
                  {exp.company}
                </span>
                <span style={{
                  fontSize: 11.5, color: textMuted,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}>
                  {exp.period ?? exp.period}
                </span>
              </div>
              <div style={{
                fontSize: 13, color: '#1D4ED8',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontStyle: 'italic', marginBottom: 5,
              }}>
                {exp.role}
              </div>
              {exp.bullets?.length > 0 && (
                <ul style={{ paddingLeft: '1.25em', margin: 0 }}>
                  {exp.bullets.map((b, j) => (
                    <li key={j} style={{ fontSize: 13, marginBottom: 3, color: text, lineHeight: 1.55 }}>
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── EDUCATION ── */}
      {resume.education?.length > 0 && (
        <Section title="Education" borderColor={borderCol}>
          {resume.education.map((edu, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between',
              flexWrap: 'wrap', alignItems: 'flex-start',
              marginBottom: i < resume.education.length - 1 ? 10 : 0,
            }}>
              <div>
                <span style={{
                  fontWeight: 700, fontSize: 13.5,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  color: text,
                }}>
                  {edu.institution}
                </span>
                <p style={{
                  fontSize: 12.5, color: textMuted,
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  fontStyle: 'italic', margin: '2px 0 0',
                }}>
                  {edu.degree}
                </p>
              </div>
              <span style={{
                fontSize: 11.5, color: textMuted,
                fontFamily: 'Inter, -apple-system, sans-serif',
              }}>
                {edu.period ?? edu.period}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* ── SKILLS ── */}
      {resume.skills?.length > 0 && (
        <Section title="Skills" borderColor={borderCol}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {resume.skills.map((s, i) => (
              <span key={i} style={{
                background: skillBg,
                color: skillText,
                borderRadius: 99,
                fontSize: 11.5,
                padding: '3px 11px',
                fontFamily: 'Inter, -apple-system, sans-serif',
                fontWeight: 500,
              }}>
                {s}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* ── ACHIEVEMENTS ── */}
      {resume.languages?.length > 0 && (
        <Section title="Languages" borderColor={borderCol}>
          <p style={{ fontSize: 13, color: text, margin: 0, lineHeight: 1.6 }}>{resume.languages.join(', ')}</p>
        </Section>
      )}

      {resume.hobbies?.length > 0 && (
        <Section title="Hobbies" borderColor={borderCol}>
          <p style={{ fontSize: 13, color: text, margin: 0, lineHeight: 1.6 }}>{resume.hobbies.join(', ')}</p>
        </Section>
      )}

      {resume.achievements?.length > 0 && (
        <Section title="Achievements & Certifications" borderColor={borderCol}>
          <ul style={{ paddingLeft: '1.25em', margin: 0 }}>
            {resume.achievements.map((a, i) => (
              <li key={i} style={{ fontSize: 13, marginBottom: 3, color: text, lineHeight: 1.55 }}>
                {a}
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
  borderColor,
}: {
  title: string;
  children: React.ReactNode;
  borderColor: string;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontSize: 11.5,
        fontWeight: 800,
        letterSpacing: 0,
        textTransform: 'uppercase',
        color: '#1D4ED8',
        fontFamily: 'Inter, -apple-system, sans-serif',
        margin: '0 0 8px',
        paddingBottom: 4,
        borderBottom: `1px solid ${borderColor}`,
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}
