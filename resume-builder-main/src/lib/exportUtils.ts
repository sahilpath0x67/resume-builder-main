import type { FormData, ResumeOutput } from './types';

export interface ResumeProjectBackup {
  version: 1;
  exportedAt: string;
  form: FormData;
  resume: ResumeOutput | null;
  coverLetter: string;
  template: string;
}

/* ─────────────────────────────────────────────
   PDF EXPORT
   Uses html2pdf.js to convert the live resume
   preview DOM element into a downloadable PDF.
───────────────────────────────────────────── */
export async function downloadPDF(elementId: string, filename = 'resume.pdf') {
  const el = document.getElementById(elementId);
  if (!el) {
    alert('Resume preview not found. Make sure you have generated a resume first.');
    return;
  }
  const previousMinHeight = el.style.minHeight;
  const previousBorderRadius = el.style.borderRadius;
  el.style.minHeight = '297mm';
  el.style.borderRadius = '0';

  // Dynamically import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const opt = {
    margin:      [0, 0, 0, 0] as [number, number, number, number],
    filename,
    image:       { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
    jsPDF:       { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(opt).from(el).save();
  } finally {
    el.style.minHeight = previousMinHeight;
    el.style.borderRadius = previousBorderRadius;
  }
}

/* ─────────────────────────────────────────────
   HTML / CSS EXPORT
   Generates a fully self-contained .html file
   with all styles inlined — no external deps.
   Opens in any browser, prints cleanly.
───────────────────────────────────────────── */
export function downloadHTML(resume: ResumeOutput) {
  const html = buildHTMLString(resume);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${resume.name.replace(/\s+/g, '_') || 'resume'}_resume.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadProjectBackup(project: ResumeProjectBackup) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const safeName = (project.resume?.name || project.form.name || 'resume')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'resume';
  a.href = url;
  a.download = `${safeName}_NepAstra_backup.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readProjectBackup(file: File): Promise<ResumeProjectBackup> {
  const text = await file.text();
  const parsed = JSON.parse(text) as Partial<ResumeProjectBackup>;

  if (parsed.version !== 1 || !parsed.form) {
    throw new Error('Invalid NepAstra backup file.');
  }

  return {
    version: 1,
    exportedAt: parsed.exportedAt || new Date().toISOString(),
    form: parsed.form,
    resume: parsed.resume ?? null,
    coverLetter: parsed.coverLetter ?? '',
    template: parsed.template || 'classic',
  };
}

function buildHTMLString(r: ResumeOutput): string {
  const exp = (r.experience || []).map(e => `
    <div class="block">
      <div class="row-between">
        <strong>${esc(e.company)}</strong>
        <span class="muted">${esc(e.period)}</span>
      </div>
      <div class="role">${esc(e.role)}</div>
      <ul>${(e.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
    </div>`).join('');

  const edu = (r.education || []).map(e => `
    <div class="block">
      <div class="row-between">
        <strong>${esc(e.institution)}</strong>
        <span class="muted">${esc(e.period)}</span>
      </div>
      <div class="role">${esc(e.degree)}</div>
    </div>`).join('');

  const skills = (r.skills || []).map(s =>
    `<span class="tag">${esc(s)}</span>`).join('');

  const languages = (r.languages || []).map(s =>
    `<span class="tag neutral">${esc(s)}</span>`).join('');

  const hobbies = (r.hobbies || []).map(s =>
    `<span class="tag neutral">${esc(s)}</span>`).join('');

  const ach = (r.achievements || []).length > 0 ? `
    <div class="section">
      <h2>Achievements &amp; Certifications</h2>
      <ul>${r.achievements.map(a => `<li>${esc(a)}</li>`).join('')}</ul>
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${esc(r.name)} — Resume</title>
<style>
  /* ── You can edit this CSS to change the look of your resume ── */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 13px;
    line-height: 1.65;
    color: #1a1a1a;
    background: #fff;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    max-width: 100%;
    margin: 0 auto;
    padding: 18mm 19mm;
    box-sizing: border-box;
  }
  .header-row { display: flex; align-items: flex-start; gap: 18px; }
  .identity { flex: 1; min-width: 0; }
  .photo {
    width: 84px;
    height: 84px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #1D4ED8;
    flex-shrink: 0;
  }
  /* Header */
  h1 {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #111;
    margin-bottom: 2px;
  }
  .title-line {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #1D4ED8;
    margin-bottom: 8px;
  }
  .contacts {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #6b7280;
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 14px;
  }
  .contacts a { color: #1D4ED8; text-decoration: none; }
  .divider {
    height: 2px;
    background: #1D4ED8;
    border-radius: 1px;
    margin-bottom: 22px;
  }
  /* Sections */
  .section { margin-bottom: 20px; }
  h2 {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
    color: #1D4ED8;
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 0.5px solid #e5e7eb;
  }
  .summary { font-size: 12px; line-height: 1.8; }
  /* Experience / Education blocks */
  .block { margin-bottom: 13px; }
  .row-between {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
  }
  .row-between strong {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 13px;
  }
  .muted {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    color: #9ca3af;
  }
  .role {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
    margin: 2px 0 4px;
  }
  ul { padding-left: 18px; }
  li { font-size: 12px; margin-bottom: 2px; }
  /* Skills */
  .tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    background: #DBEAFE;
    color: #1E3A8A;
    border-radius: 20px;
    font-size: 11px;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 500;
    padding: 3px 10px;
  }
  .tag.neutral {
    background: #f3f4f6;
    color: #374151;
  }
  /* Print */
  @page { size: A4; margin: 0; }
  @media print {
    html, body { width: 210mm; min-height: 297mm; background: white; }
    .page { margin: 0; }
  }
</style>
</head>
<body>
<div class="page">

  <div class="header-row">
    ${r.photo ? `<img class="photo" src="${esc(r.photo)}" alt="">` : ''}
    <div class="identity">
      <h1>${esc(r.name)}</h1>
      ${r.title ? `<div class="title-line">${esc(r.title)}</div>` : ''}
      <div class="contacts">
        ${r.email    ? `<span>${esc(r.email)}</span>` : ''}
        ${r.phone    ? `<span>${esc(r.phone)}</span>` : ''}
        ${r.location ? `<span>${esc(r.location)}</span>` : ''}
        ${r.linkedin ? `<a href="${esc(r.linkedin)}">${esc(r.linkedin)}</a>` : ''}
      </div>
    </div>
  </div>
  <div class="divider"></div>

  ${r.summary ? `
  <div class="section">
    <h2>Professional Summary</h2>
    <p class="summary">${esc(r.summary)}</p>
  </div>` : ''}

  ${exp ? `
  <div class="section">
    <h2>Experience</h2>
    ${exp}
  </div>` : ''}

  ${edu ? `
  <div class="section">
    <h2>Education</h2>
    ${edu}
  </div>` : ''}

  ${skills ? `
  <div class="section">
    <h2>Skills</h2>
    <div class="tags">${skills}</div>
  </div>` : ''}

  ${languages ? `
  <div class="section">
    <h2>Languages</h2>
    <div class="tags">${languages}</div>
  </div>` : ''}

  ${hobbies ? `
  <div class="section">
    <h2>Hobbies</h2>
    <div class="tags">${hobbies}</div>
  </div>` : ''}

  ${ach}

</div>
</body>
</html>`;
}

/* ─────────────────────────────────────────────
   PLAIN TEXT EXPORT (for Word / Google Docs)
───────────────────────────────────────────── */
export function copyAsText(r: ResumeOutput): string {
  return [
    r.name,
    r.title,
    [r.email, r.phone, r.location, r.linkedin].filter(Boolean).join(' | '),
    '',
    'PROFESSIONAL SUMMARY',
    r.summary || '',
    '',
    'EXPERIENCE',
    ...(r.experience || []).flatMap(e => [
      `${e.company} — ${e.role} | ${e.period}`,
      ...(e.bullets || []).map(b => '• ' + b),
      '',
    ]),
    'EDUCATION',
    ...(r.education || []).map(e => `${e.institution} — ${e.degree} | ${e.period}`),
    '',
    'SKILLS',
    (r.skills || []).join(', '),
    ...(r.languages?.length ? ['', 'LANGUAGES', r.languages.join(', ')] : []),
    ...(r.hobbies?.length ? ['', 'HOBBIES', r.hobbies.join(', ')] : []),
    ...(r.achievements?.length
      ? ['', 'ACHIEVEMENTS & CERTIFICATIONS', ...r.achievements.map(a => '• ' + a)]
      : []),
  ].join('\n');
}

// Escape HTML special characters to prevent XSS in the exported file
function esc(str: string = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
