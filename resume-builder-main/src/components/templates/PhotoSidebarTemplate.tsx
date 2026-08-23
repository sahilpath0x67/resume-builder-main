import type { ResumeOutput } from '../../lib/types';
import { getResumeDensity, scaleGap, scalePx, type ResumeDensity } from '../../lib/resumeLayout';

export default function PhotoSidebarTemplate({ resume, dark: D }: { resume: ResumeOutput; dark: boolean }) {
  const sidebar = '#202a35';
  const accent = '#68b8c8';
  const bodyText = '#111827';
  const muted = '#4b5563';
  const photoInitial = resume.name?.trim().charAt(0).toUpperCase() || '?';
  const density = getResumeDensity(resume);
  const roomy = density.level === 'roomy' || density.level === 'relaxed';
  const px = (value: number, min?: number, max?: number) => scalePx(value, density, min, max);
  const gap = (value: number, min?: number, max?: number) => scaleGap(value, density, min, max);

  return (
    <div id="resume-output" style={{
      width: '210mm',
      minHeight: '297mm',
      maxWidth: '100%',
      margin: '0 auto',
      background: '#ffffff',
      color: bodyText,
      display: 'grid',
      gridTemplateColumns: density.level === 'compact' ? '66mm 1fr' : '72mm 1fr',
      overflow: 'hidden',
      borderRadius: 8,
      fontFamily: 'Arial, Helvetica, sans-serif',
      fontSize: px(12, 11.4, 14.4),
      lineHeight: roomy ? 1.6 : 1.48,
      boxShadow: D ? '0 16px 40px rgba(0,0,0,0.35)' : '0 8px 28px rgba(15,23,42,0.12)',
    }}>
      <aside style={{ background: sidebar, color: '#fff', padding: roomy ? '17mm 9.5mm 14mm' : '13mm 8.5mm 10mm' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: gap(18, 16, 30) }}>
          <div style={{
            width: px(96, 86, 122),
            height: px(96, 86, 122),
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.86)',
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: px(34, 30, 42),
            fontWeight: 700,
            marginBottom: gap(12, 10, 18),
          }}>
            {resume.photo ? (
              <img src={resume.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : photoInitial}
          </div>
          <h1 style={{ fontSize: px(22, 19, 29), lineHeight: 1.08, margin: '0 0 5px', fontWeight: 700 }}>{resume.name || 'Your Name'}</h1>
          {resume.title && <p style={{ color: accent, fontSize: px(11.5, 10.5, 14), margin: 0 }}>{resume.title}</p>}
        </div>

        <SidebarSection title="Contact" density={density}>
          {resume.phone && <SidebarLine>{resume.phone}</SidebarLine>}
          {resume.email && <SidebarLine>{resume.email}</SidebarLine>}
          {resume.location && <SidebarLine>{resume.location}</SidebarLine>}
          {resume.linkedin && <SidebarLine>{resume.linkedin}</SidebarLine>}
        </SidebarSection>

        {resume.skills?.length > 0 && (
          <SidebarSection title="Skills" density={density}>
            <SidebarList items={resume.skills} density={density} />
          </SidebarSection>
        )}

        {resume.languages?.length > 0 && (
          <SidebarSection title="Languages" density={density}>
            <SidebarList items={resume.languages} density={density} />
          </SidebarSection>
        )}

        {resume.hobbies?.length > 0 && (
          <SidebarSection title="Hobbies" density={density}>
            <SidebarList items={resume.hobbies} density={density} />
          </SidebarSection>
        )}
      </aside>

      <main style={{
        padding: roomy ? '18mm 15mm 15mm' : '16mm 13mm 12mm',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: roomy ? 'space-between' : 'flex-start',
      }}>
        {resume.summary && (
          <MainSection title="Profile" density={density}>
            <p style={{ margin: 0, color: '#1f2937', fontSize: px(11.7, 11, 14.2), textAlign: 'justify', lineHeight: roomy ? 1.68 : 1.52 }}>{resume.summary}</p>
          </MainSection>
        )}

        {resume.experience?.length > 0 && (
          <MainSection title="Work Experience" density={density}>
            {resume.experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: i < resume.experience.length - 1 ? gap(12, 10, 20) : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0, fontSize: px(12.5, 11.6, 15), lineHeight: 1.25, color: bodyText }}>{exp.role}</h3>
                    <p style={{ margin: '1px 0 5px', fontSize: px(10.4, 10, 12.4), color: muted }}>{exp.company}</p>
                  </div>
                  {exp.period && <span style={{ flexShrink: 0, fontSize: px(10.2, 9.8, 12), color: bodyText }}>{exp.period}</span>}
                </div>
                {exp.bullets?.length > 0 && (
                  <ul style={{ margin: 0, paddingLeft: 15 }}>
                    {exp.bullets.map((bullet, j) => (
                      <li key={j} style={{ marginBottom: gap(4, 3, 7), color: bodyText, fontSize: px(11.3, 10.8, 13.6), lineHeight: roomy ? 1.6 : 1.44 }}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </MainSection>
        )}

        {resume.education?.length > 0 && (
          <MainSection title="Education" density={density}>
            {resume.education.map((edu, i) => (
              <div key={i} style={{ marginBottom: i < resume.education.length - 1 ? gap(12, 10, 18) : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                  <h3 style={{ margin: 0, fontSize: px(12.2, 11.4, 14.6), color: bodyText }}>{edu.degree}</h3>
                  {edu.period && <span style={{ flexShrink: 0, fontSize: px(10.2, 9.8, 12), color: bodyText }}>{edu.period}</span>}
                </div>
                <p style={{ margin: '3px 0 0', color: muted, fontSize: px(10.8, 10.2, 12.8), fontStyle: 'italic' }}>{edu.institution}</p>
              </div>
            ))}
          </MainSection>
        )}

        {resume.achievements?.length > 0 && (
          <MainSection title="Achievements" density={density}>
            <ul style={{ margin: 0, paddingLeft: 15 }}>
              {resume.achievements.map((achievement, i) => (
                <li key={i} style={{ marginBottom: gap(4, 3, 7), color: bodyText, fontSize: px(11.3, 10.8, 13.6), lineHeight: roomy ? 1.6 : 1.45 }}>{achievement}</li>
              ))}
            </ul>
          </MainSection>
        )}
      </main>
    </div>
  );
}

function SidebarSection({ title, children, density }: { title: string; children: React.ReactNode; density: ResumeDensity }) {
  return (
    <section style={{ marginTop: scaleGap(23, density, 18, 34) }}>
      <h2 style={{ margin: '0 0 8px', fontSize: scalePx(12.4, density, 11.4, 14.5), letterSpacing: 0, textTransform: 'uppercase', fontWeight: 700 }}>{title}</h2>
      {children}
    </section>
  );
}

function SidebarLine({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 6px', color: 'rgba(255,255,255,0.76)', fontSize: '0.92em', lineHeight: 1.45, wordBreak: 'break-word' }}>{children}</p>;
}

function SidebarList({ items, density }: { items: string[]; density: ResumeDensity }) {
  return (
    <ul style={{ listStyle: 'circle', margin: 0, paddingLeft: 14 }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: 'rgba(255,255,255,0.82)', fontSize: scalePx(10.3, density, 9.8, 12.4), marginBottom: scaleGap(4, density, 3, 7), lineHeight: 1.42 }}>{item}</li>
      ))}
    </ul>
  );
}

function MainSection({ title, children, density }: { title: string; children: React.ReactNode; density: ResumeDensity }) {
  return (
    <section style={{ marginBottom: scaleGap(19, density, 14, 34) }}>
      <h2 style={{ margin: '0 0 9px', color: '#111827', fontSize: scalePx(14.2, density, 13.2, 17), textTransform: 'uppercase', fontWeight: 800, letterSpacing: 0 }}>{title}</h2>
      {children}
    </section>
  );
}
