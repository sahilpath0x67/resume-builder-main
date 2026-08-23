// src/lib/exportDocx.ts
// Export resume as a .docx Word file using the docx library
// Run: npm install docx file-saver @types/file-saver

import {
  Document, Packer, Paragraph, TextRun,
  BorderStyle,
} from 'docx';

import { saveAs } from 'file-saver';
import type { ResumeOutput } from './types';

function rule() {
  return new Paragraph({
    border: { bottom: { color: '1D4ED8', size: 6, style: BorderStyle.SINGLE } },
    spacing: { after: 80 },
  });
}

function sectionTitle(text: string) {
  return new Paragraph({
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 18, color: '1D4ED8', font: 'Calibri' })],
    spacing: { before: 200, after: 60 },
    border: { bottom: { color: 'E5E7EB', size: 4, style: BorderStyle.SINGLE } },
  });
}

function bullet(text: string) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: 'Calibri', color: '374151' })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

export async function downloadDOCX(resume: ResumeOutput, filename?: string) {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22, color: '111827' },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
      },
      children: [
        // ── NAME ──
        new Paragraph({
          children: [new TextRun({ text: resume.name, bold: true, size: 52, font: 'Calibri', color: '111827' })],
          spacing: { after: 60 },
        }),
        // ── TITLE ──
        ...(resume.title ? [new Paragraph({
          children: [new TextRun({ text: resume.title, size: 24, color: '1D4ED8', bold: true, font: 'Calibri' })],
          spacing: { after: 80 },
        })] : []),
        // ── CONTACT ──
        new Paragraph({
          children: [
            resume.email    ? new TextRun({ text: resume.email,    size: 18, color: '6B7280', font: 'Calibri' }) : null,
            resume.phone    ? new TextRun({ text: `  |  ${resume.phone}`,    size: 18, color: '6B7280', font: 'Calibri' }) : null,
            resume.location ? new TextRun({ text: `  |  ${resume.location}`, size: 18, color: '6B7280', font: 'Calibri' }) : null,
            resume.linkedin ? new TextRun({ text: `  |  ${resume.linkedin}`, size: 18, color: '1D4ED8', font: 'Calibri' }) : null,
          ].filter(Boolean) as TextRun[],
          spacing: { after: 60 },
        }),
        rule(),

        // ── SUMMARY ──
        ...(resume.summary ? [
          sectionTitle('Professional Summary'),
          new Paragraph({ children: [new TextRun({ text: resume.summary, size: 20, font: 'Calibri', color: '374151', italics: true })], spacing: { after: 120 } }),
        ] : []),

        // ── EXPERIENCE ──
        ...(resume.experience?.length > 0 ? [
          sectionTitle('Experience'),
          ...resume.experience.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.company, bold: true, size: 22, font: 'Calibri', color: '111827' }),
                new TextRun({ text: `  —  ${exp.period}`, size: 18, color: '9CA3AF', font: 'Calibri' }),
              ],
              spacing: { before: 120, after: 30 },
            }),
            new Paragraph({
              children: [new TextRun({ text: exp.role, size: 20, color: '1D4ED8', font: 'Calibri', italics: true })],
              spacing: { after: 60 },
            }),
            ...(exp.bullets || []).map(b => bullet(b)),
          ]),
        ] : []),

        // ── EDUCATION ──
        ...(resume.education?.length > 0 ? [
          sectionTitle('Education'),
          ...resume.education.flatMap(edu => [
            new Paragraph({
              children: [
                new TextRun({ text: edu.institution, bold: true, size: 22, font: 'Calibri', color: '111827' }),
                new TextRun({ text: `  —  ${edu.period}`, size: 18, color: '9CA3AF', font: 'Calibri' }),
              ],
              spacing: { before: 80, after: 30 },
            }),
            new Paragraph({
              children: [new TextRun({ text: edu.degree, size: 20, color: '6B7280', font: 'Calibri', italics: true })],
              spacing: { after: 80 },
            }),
          ]),
        ] : []),

        // ── SKILLS ──
        ...(resume.skills?.length > 0 ? [
          sectionTitle('Skills'),
          new Paragraph({
            children: [new TextRun({ text: resume.skills.join('  ·  '), size: 20, font: 'Calibri', color: '374151' })],
            spacing: { after: 120 },
          }),
        ] : []),

        // ── ACHIEVEMENTS ──
        ...(resume.languages?.length > 0 ? [
          sectionTitle('Languages'),
          new Paragraph({
            children: [new TextRun({ text: resume.languages.join(', '), size: 20, font: 'Calibri', color: '374151' })],
            spacing: { after: 120 },
          }),
        ] : []),

        ...(resume.hobbies?.length > 0 ? [
          sectionTitle('Hobbies'),
          new Paragraph({
            children: [new TextRun({ text: resume.hobbies.join(', '), size: 20, font: 'Calibri', color: '374151' })],
            spacing: { after: 120 },
          }),
        ] : []),

        ...(resume.achievements?.length > 0 ? [
          sectionTitle('Achievements & Certifications'),
          ...resume.achievements.map(a => bullet(a)),
        ] : []),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename ?? `${resume.name.replace(/\s+/g, '_')}_resume.docx`);
}
