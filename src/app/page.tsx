'use client';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../lib/useAuth';
import { saveCV, deleteCV } from '../lib/userStore';
import type { SavedCV } from '../lib/userStore';
import type {
  FormData,
  ResumeOutput,
  Experience,
  Education,
  Language,
  Project,
  Certification,
  Achievement,
  VolunteerExperience,
} from '../lib/types';
import { downloadPDF, downloadHTML, copyAsText, downloadProjectBackup, readProjectBackup } from '../lib/exportUtils';
import { downloadDOCX } from '../lib/exportDocx';
import { getAIErrorMessage } from '../lib/aiErrors';
import {
  ACHIEVEMENT_TEMPLATES,
  BULLET_TEMPLATES,
  SKILL_PRESETS,
  SUMMARY_TEMPLATES,
  buildBulletTemplate,
  buildSummaryTemplate,
  mergeSkills,
  type AchievementTemplateId,
  type BulletTemplateId,
  type SkillPresetId,
  type SummaryTemplateId,
} from '../lib/localTemplates';
import ClassicTemplate from '../components/templates/ClassicTemplate';
import ModernTemplate from '../components/templates/ModernTemplate';
import MinimalTemplate from '../components/templates/MinimalTemplate';
import ExecutiveTemplate from '../components/templates/ExecutiveTemplate';
import CreativeTemplate from '../components/templates/CreativeTemplate';
import CompactTemplate from '../components/templates/CompactTemplate';
import BoldTemplate from '../components/templates/BoldTemplate';
import PhotoSidebarTemplate from '../components/templates/PhotoSidebarTemplate';
import CoverLetterPanel from '../components/CoverLetterPanel';
import ATSScorePanel from '../components/ATSScorePanel';
import LinkedInPanel from '../components/LinkedInPanel';
import SavedCVsPanel from '../components/SavedCVsPanel';
import TailorPanel from '../components/TailorPanel';
import ResumeCoachPanel from '../components/ResumeCoachPanel';
import { analyzeResume, type InsightSection } from '../lib/resumeInsights';

// ── Toast system ──────────────────────────────────────────────────────────────
interface Toast { id: number; msg: string; type: 'ok' | 'err' | 'info'; }
let toastId = 0;

// ── helpers ──────────────────────────────────────────────────────────────────
function splitList(value: string | undefined): string[] {
  return value ? value.split(/[\n,]/).map(item => item.trim()).filter(Boolean) : [];
}

const BRACKET_PLACEHOLDER = /\[[^\]]+\]/g;
const HAS_BRACKET_PLACEHOLDER = /\[[^\]]+\]/;

function cleanPlaceholderText(value: string | undefined): string {
  return (value || '')
    .replace(BRACKET_PLACEHOLDER, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function cleanPreviewList(items: string[] | undefined): string[] {
  return (items || []).map(cleanPlaceholderText).filter(Boolean);
}

function cleanAchievementForPreview(value: string): string {
  if (!HAS_BRACKET_PLACEHOLDER.test(value)) return value.trim();

  const lower = value.toLowerCase();
  if (lower.startsWith('earned')) {
    return 'Earned relevant training or certification to strengthen professional knowledge and delivery.';
  }
  if (lower.startsWith('launched')) {
    return 'Launched a project or process improvement that supported team goals and better execution.';
  }
  if (lower.startsWith('recognized')) {
    return 'Recognized for dependable work quality, ownership, and positive contribution to team outcomes.';
  }
  if (lower.startsWith('improved')) {
    return 'Improved a workflow by identifying gaps, simplifying steps, and supporting more consistent results.';
  }
  if (lower.startsWith('built')) {
    return 'Built a portfolio project to demonstrate practical skills and solve a real user or business problem.';
  }
  if (lower.startsWith('completed')) {
    return 'Completed relevant training and applied the learning to stronger, more organized project work.';
  }

  return cleanPlaceholderText(value);
}

function cleanBulletForPreview(value: string, exp?: Partial<Experience>): string {
  if (!HAS_BRACKET_PLACEHOLDER.test(value)) return value.trim();

  const role = exp?.role?.trim() || 'the role';
  const company = exp?.company?.trim();
  const area = company ? ` at ${company}` : '';

  if (/^led\b/i.test(value)) return `Led project coordination${area}, helping the team deliver priorities on schedule.`;
  if (/^built\b|^developed\b|^created\b/i.test(value)) return `Built or improved practical workflows${area}, reducing manual work and improving reliability.`;
  if (/^increased\b|^improved\b/i.test(value)) return `Improved ${role} results${area} by tracking progress, solving blockers, and refining the process.`;
  return `Delivered useful results${area} by taking ownership, solving blockers, and following through.`;
}

function formToResume(form: FormData): ResumeOutput {
  return {
    name: form.name,
    title: form.title,
    email: form.email,
    phone: form.phone,
    location: form.location,

    linkedin: form.linkedin,
    portfolio: form.portfolio,
    github: form.github,

    photo: form.photo,
    summary: form.summary,

    experience: form.experience
      .filter(e => e.company || e.role)
      .map(e => ({
        company: e.company,
        role: e.role,
        location: e.location,
        employmentType: e.employmentType,
        period: `${e.start}${e.current ? ' – Present' : e.end ? ` – ${e.end}` : ''}`,
        bullets: e.desc
          ? e.desc
            .split('\n')
            .map(b => cleanBulletForPreview(b, e))
            .filter(Boolean)
          : [],
      })),

    education: form.education
      .filter(e => e.institution || e.degree)
      .map(e => ({
        institution: e.institution,
        degree: e.degree,
        field: e.field,
        location: e.location,
        period: `${e.start}${e.end ? ` – ${e.end}` : ''}`,
        gpa: e.gpa,
        coursework: splitList(e.coursework),
        achievements: splitList(e.achievements),
      })),

    projects: form.projects
      .filter(p => p.name || p.description)
      .map(p => ({
        name: p.name,
        description: p.description,
        role: p.role,
        technologies: splitList(p.technologies),
        period: `${p.start}${p.end ? ` – ${p.end}` : ''}`,
        url: p.url,
        github: p.github,
      })),

    skills: splitList(form.skills),

    languages: form.languages
      .filter(l => l.name.trim())
      .map(l => ({
        name: l.name,
        level: l.level,
      })),

    certifications: form.certifications
      .filter(c => c.name || c.issuer)
      .map(c => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        credentialId: c.credentialId,
        url: c.url,
      })),

    achievements: form.achievements
      .filter(a => a.title || a.description)
      .map(a => ({
        title: a.title,
        organization: a.organization,
        date: a.date,
        description: a.description,
      })),

    volunteer: form.volunteer
      .filter(v => v.organization || v.role)
      .map(v => ({
        organization: v.organization,
        role: v.role,
        location: v.location,
        period: `${v.start}${v.end ? ` – ${v.end}` : ''}`,
        bullets: v.desc
          ? v.desc.split('\n').filter(Boolean)
          : [],
      })),

    hobbies: splitList(form.hobbies),
  };
}
// General ATS score — computed locally, no API needed
function computeQuickScore(r: ResumeOutput): number {
  let score = 0;
  // Contact info (25 pts)
  if (r.email) score += 6;
  if (r.phone) score += 6;
  if (r.location) score += 6;
  if (r.linkedin) score += 7;
  // Summary (15 pts)
  const sw = r.summary?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  if (sw > 30) score += 15; else if (sw > 10) score += 8;
  // Bullets with action verbs (25 pts)
  const VERBS = ['led', 'built', 'increased', 'decreased', 'developed', 'managed', 'delivered', 'launched', 'designed', 'implemented', 'grew', 'achieved', 'generated', 'saved', 'automated', 'drove', 'executed'];
  const bullets = r.experience?.flatMap(e => e.bullets ?? []) ?? [];
  const withVerb = bullets.filter(b => VERBS.some(v => b.toLowerCase().startsWith(v))).length;
  if (bullets.length > 0) score += Math.round((withVerb / bullets.length) * 25);
  // Quantification (20 pts)
  const quant = bullets.filter(b => /\d+(%|\+|k|m|\$|x)/.test(b)).length;
  if (bullets.length > 0) score += Math.round((quant / bullets.length) * 20);
  // Skills (15 pts)
  const sc = r.skills?.length ?? 0;
  if (sc >= 8) score += 15; else if (sc >= 4) score += 8; else if (sc > 0) score += 4;
  return Math.min(100, score);
}

function resumeWordCount(r: ResumeOutput): number {
  const all = [
    r.summary,
    ...(r.experience?.flatMap(e => e.bullets ?? []) ?? []),
    ...(r.education?.flatMap(e => [
      e.degree ?? '',
      e.field ?? '',
      ...(e.coursework ?? []),
      ...(e.achievements ?? []),
    ]) ?? []),
    ...(r.projects?.flatMap(p => [
      p.name ?? '',
      p.description ?? '',
      p.role ?? '',
      ...(p.technologies ?? []),
      ...(p.bullets ?? []),
    ]) ?? []),
    ...(r.certifications?.flatMap(c => [c.name ?? '', c.issuer ?? '']) ?? []),
    ...(r.achievements?.flatMap(a => [a.title ?? '', a.description ?? '']) ?? []),
    ...(r.volunteer?.flatMap(v => [v.organization ?? '', v.role ?? '', ...(v.bullets ?? [])]) ?? []),
    ...(r.skills ?? []),
    ...(r.languages?.flatMap(l => [l.name ?? '', l.level ?? '']) ?? []),
    ...(r.hobbies ?? []),
  ].join(' ');

  return all.trim() ? all.trim().split(/\s+/).length : 0;
}

function resumeLengthLabel(words: number): { label: string; color: string } {
  if (words < 180) return { label: 'Sparse A4', color: '#f87171' };
  if (words < 300) return { label: 'Light A4', color: '#fbbf24' };
  if (words <= 620) return { label: 'A4 fit', color: '#4ade80' };
  if (words <= 780) return { label: 'Dense A4', color: '#fbbf24' };
  return { label: 'Too long', color: '#f87171' };
}

function hasResumeContent(resume: ResumeOutput): boolean {
  return Boolean(
    resume.name ||
    resume.title ||
    resume.summary ||
    resume.photo ||
    resume.linkedin ||
    resume.portfolio ||
    resume.github ||
    resume.skills?.length ||
    resume.languages?.length ||
    resume.hobbies?.length ||
    resume.experience?.some(exp => exp.company || exp.role || exp.bullets?.length) ||
    resume.education?.some(edu => edu.institution || edu.degree) ||
    resume.projects?.some(project => project.name || project.description) ||
    resume.certifications?.some(cert => cert.name || cert.issuer) ||
    resume.achievements?.some(item => item.title || item.description) ||
    resume.volunteer?.some(item => item.organization || item.role)
  );
}

const EMPTY_EXP = (): Experience => ({
  company: '',
  role: '',
  location: '',
  employmentType: 'Full-time',
  start: '',
  end: '',
  current: false,
  desc: '',
});

const EMPTY_EDU = (): Education => ({
  institution: '',
  degree: '',
  field: '',
  location: '',
  start: '',
  end: '',
  gpa: '',
  coursework: '',
  achievements: '',
});

const EMPTY_PROJECT = (): Project => ({
  name: '',
  description: '',
  role: '',
  technologies: '',
  start: '',
  end: '',
  url: '',
  github: '',
});

const EMPTY_CERT = (): Certification => ({
  name: '',
  issuer: '',
  date: '',
  credentialId: '',
  url: '',
});

const EMPTY_ACHIEVEMENT = (): Achievement => ({
  title: '',
  organization: '',
  date: '',
  description: '',
});

const EMPTY_VOLUNTEER = (): VolunteerExperience => ({
  organization: '',
  role: '',
  location: '',
  start: '',
  end: '',
  desc: '',
});

const EMPTY_LANGUAGE = (): Language => ({
  name: '',
  level: '',
});

const EMPTY_FORM = (): FormData => ({
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  portfolio: '',
  github: '',
  photo: '',
  summary: '',
  skills: '',
  languages: [],
  hobbies: '',
  experience: [EMPTY_EXP()],
  education: [EMPTY_EDU()],
  projects: [],
  certifications: [],
  achievements: [],
  volunteer: [],
});
function normalizeForm(value?: Partial<FormData> | null): FormData {
  const base = EMPTY_FORM();

  if (!value) return base;

  const oldLanguages = value.languages as
    | Language[]
    | string
    | undefined;

  const languages: Language[] =
    Array.isArray(oldLanguages)
      ? oldLanguages
      : typeof oldLanguages === 'string'
        ? oldLanguages
          .split(/[\n,]/)
          .map(item => item.trim())
          .filter(Boolean)
          .map(item => {
            const parts = item.split(/\s*-\s*/);

            return {
              name: parts[0] ?? '',
              level: parts.slice(1).join(' - ') ?? '',
            };
          })
        : [];

  const oldAchievements = value.achievements as
    | Achievement[]
    | string
    | undefined;

  const achievements: Achievement[] =
    Array.isArray(oldAchievements)
      ? oldAchievements
      : typeof oldAchievements === 'string'
        ? oldAchievements
          .split(/[\n,]/)
          .map(item => item.trim())
          .filter(Boolean)
          .map(item => ({
            title: item,
            organization: '',
            date: '',
            description: '',
          }))
        : [];

  return {
    ...base,
    ...value,

    experience: value.experience?.length
      ? value.experience.map(exp => ({
        ...EMPTY_EXP(),
        ...exp,
      }))
      : [EMPTY_EXP()],

    education: value.education?.length
      ? value.education.map(edu => ({
        ...EMPTY_EDU(),
        ...edu,
      }))
      : [EMPTY_EDU()],

    projects: value.projects?.length
      ? value.projects.map(project => ({
        ...EMPTY_PROJECT(),
        ...project,
      }))
      : [],

    certifications: value.certifications?.length
      ? value.certifications.map(cert => ({
        ...EMPTY_CERT(),
        ...cert,
      }))
      : [],

    achievements,

    volunteer: value.volunteer?.length
      ? value.volunteer.map(item => ({
        ...EMPTY_VOLUNTEER(),
        ...item,
      }))
      : [],

    languages,
  };
}

function normalizeResume(
  value?: Partial<ResumeOutput> | null,
  fallbackForm?: FormData
): ResumeOutput | null {
  if (!value) return null;

  const fallbackResume = fallbackForm
    ? formToResume(fallbackForm)
    : null;

  return {
    name: value.name ?? fallbackResume?.name ?? '',
    title: value.title ?? fallbackResume?.title ?? '',
    email: value.email ?? fallbackResume?.email ?? '',
    phone: value.phone ?? fallbackResume?.phone ?? '',
    location: value.location ?? fallbackResume?.location ?? '',

    linkedin: value.linkedin ?? fallbackResume?.linkedin ?? '',
    portfolio: value.portfolio ?? fallbackResume?.portfolio ?? '',
    github: value.github ?? fallbackResume?.github ?? '',

    photo: value.photo ?? fallbackResume?.photo ?? '',
    summary: value.summary ?? fallbackResume?.summary ?? '',

    experience:
      value.experience ??
      fallbackResume?.experience ??
      [],

    education:
      value.education ??
      fallbackResume?.education ??
      [],

    projects:
      value.projects ??
      fallbackResume?.projects ??
      [],

    skills:
      value.skills ??
      fallbackResume?.skills ??
      [],

    languages:
      value.languages ??
      fallbackResume?.languages ??
      [],

    certifications:
      value.certifications ??
      fallbackResume?.certifications ??
      [],

    achievements:
      value.achievements ??
      fallbackResume?.achievements ??
      [],

    volunteer:
      value.volunteer ??
      fallbackResume?.volunteer ??
      [],

    hobbies:
      value.hobbies ??
      fallbackResume?.hobbies ??
      [],
  };
}

type TemplateId = 'classic' | 'modern' | 'minimal' | 'executive' | 'creative' | 'compact' | 'bold' | 'photo-sidebar';
const TEMPLATES: { id: TemplateId; label: string; desc: string; color: string }[] = [
  { id: 'photo-sidebar', label: 'Photo Sidebar', desc: 'A4 profile sidebar', color: '#1f2937' },
  { id: 'classic', label: 'Classic', desc: 'Traditional serif', color: '#1D4ED8' },
  { id: 'modern', label: 'Modern', desc: 'Two-column sidebar', color: '#1E3A8A' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean centred', color: '#6b7280' },
  { id: 'executive', label: 'Executive', desc: 'Navy & gold', color: '#f59e0b' },
  { id: 'creative', label: 'Creative', desc: 'Purple timeline', color: '#7c3aed' },
  { id: 'compact', label: 'Compact', desc: 'Two-column green', color: '#059669' },
  { id: 'bold', label: 'Bold', desc: 'Dark header red accent', color: '#e11d48' },
];
const TEMPLATE_MAP = { classic: ClassicTemplate, modern: ModernTemplate, minimal: MinimalTemplate, executive: ExecutiveTemplate, creative: CreativeTemplate, compact: CompactTemplate, bold: BoldTemplate, 'photo-sidebar': PhotoSidebarTemplate };

const LEFT_TABS = [
  'Basics',
  'Experience',
  'Education',
  'More',
] as const;
const RIGHT_PANELS = [
  { id: 'preview', label: 'Preview', icon: '📄' },
  { id: 'coach', label: 'Coach', icon: '✓' },
  { id: 'saved', label: 'My CVs', icon: '💾' },
  { id: 'tailor', label: 'Tailor', icon: '🎯' },
  { id: 'cover', label: 'Cover Letter', icon: '✉' },
  { id: 'ats', label: 'ATS Score', icon: '⚡' },
  { id: 'linkedin', label: 'LinkedIn', icon: '🔗' },
] as const;
type RightPanel = (typeof RIGHT_PANELS)[number]['id'];

const BRAND = {
  name: 'NepAstra',
  logo: '/nepastra-logo.jpeg',
  blue: '#1D4ED8',
  red: '#DC2626',
  navy: '#172554',
  blueSoft: 'rgba(29,78,216,0.12)',
  redSoft: 'rgba(220,38,38,0.12)',
};

type FloatingMenuProps = {
  open: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
  surface: string;
  border: string;
  label: string;
  width?: number;
  align?: 'left' | 'right';
};

function FloatingMenu({
  open,
  anchorRef,
  onClose,
  children,
  surface,
  border,
  label,
  width = 220,
  align = 'right',
}: FloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 360 });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof window === 'undefined') return;

    const margin = 12;
    const gap = 8;
    const rect = anchor.getBoundingClientRect();
    const desiredLeft = align === 'right' ? rect.right - width : rect.left;
    const left = Math.max(margin, Math.min(desiredLeft, window.innerWidth - width - margin));

    let top = rect.bottom + gap;
    let maxHeight = window.innerHeight - top - margin;

    if (maxHeight < 180 && rect.top > window.innerHeight - rect.bottom) {
      maxHeight = Math.min(420, rect.top - margin - gap);
      top = Math.max(margin, rect.top - maxHeight - gap);
    }

    setPosition({
      top,
      left,
      maxHeight: Math.max(160, Math.min(420, maxHeight)),
    });
  }, [align, anchorRef, width]);

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', onClose, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', onClose, true);
    };
  }, [anchorRef, onClose, open, updatePosition]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={label}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 10000,
        width,
        maxHeight: position.maxHeight,
        overflowY: 'auto',
        background: surface,
        border: `1px solid ${border}`,
        borderRadius: 12,
        boxShadow: '0 18px 45px rgba(15,23,42,0.28)',
        padding: 4,
      }}
    >
      {children}
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const [dark, setDark] = useState(true);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [activeTab, setActiveTab] = useState(0);
  const [rightPanel, setRightPanel] = useState<RightPanel>('preview');
  const [template, setTemplate] = useState<TemplateId>('classic');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMissingItems, setShowMissingItems] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [savingCV, setSavingCV] = useState(false);
  const [improvingIdx, setImprovingIdx] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [autoSaveLabel, setAutoSaveLabel] = useState('');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAutoSave = useRef<number>(0);
  const backupInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const templateButtonRef = useRef<HTMLButtonElement | null>(null);
  const exportButtonRef = useRef<HTMLButtonElement | null>(null);

  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const isPro = true; // testing — remove before going live

  const [form, setForm] = useState<FormData>(() => {
    if (typeof window === 'undefined') return EMPTY_FORM();
    try { const s = localStorage.getItem('resume-form'); return s ? normalizeForm(JSON.parse(s)) : EMPTY_FORM(); }
    catch { return EMPTY_FORM(); }
  });
  const [resume, setResume] = useState<ResumeOutput | null>(() => {
    if (typeof window === 'undefined') return null;
    try { const s = localStorage.getItem('resume-output'); return s ? normalizeResume(JSON.parse(s), form) : null; }
    catch { return null; }
  });

  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hiringMgr, setHiringMgr] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const closeTemplates = useCallback(() => setShowTemplates(false), []);
  const closeExport = useCallback(() => setExportOpen(false), []);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toast = useCallback((msg: string, type: 'ok' | 'err' | 'info' = 'ok', duration = 3500) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (resume) localStorage.setItem('resume-output', JSON.stringify(resume));
    else localStorage.removeItem('resume-output');
  }, [resume]);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); document.body.style.background = dark ? '#111827' : '#f9fafb'; }, [dark]);
  useEffect(() => { localStorage.setItem('resume-form', JSON.stringify(form)); }, [form]);
  useEffect(() => {
    if (rightPanel !== 'preview') {
      closeTemplates();
      closeExport();
    }
  }, [closeExport, closeTemplates, rightPanel]);

  // ── Auto-save to Firestore every 30s ─────────────────────────────────────
  useEffect(() => {
    if (!user || !resume) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastAutoSave.current < 25000) return; // debounce
      lastAutoSave.current = now;
      try {
        const cv: SavedCV = {
          id: 'autosave',
          name: '⟳ Auto-saved',
          resume,
          formData: form,
          ...(coverLetter ? { coverLetter } : {}),
          updatedAt: now,
        };
        await saveCV(user.uid, cv);
        setAutoSaveLabel('Auto-saved ✓');
        setTimeout(() => setAutoSaveLabel(''), 2500);
      } catch { /* silent fail — auto-save is best effort */ }
    }, 30000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [form, resume, coverLetter, user]);

  const markFormEdited = () => setResume(null);
  const setF = (k: keyof FormData, v: string) => { markFormEdited(); setForm(f => ({ ...f, [k]: v })); };
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.', 'err');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) return;
      setF('photo', result);
      setTemplate('photo-sidebar');
      toast('Photo added to the sidebar template.', 'ok');
    };
    reader.onerror = () => toast('Could not read that image.', 'err');
    reader.readAsDataURL(file);
  };
  const upExp = (i: number, k: keyof Experience, v: string) => { markFormEdited(); setForm(f => { const e = [...f.experience]; e[i] = { ...e[i], [k]: v }; return { ...f, experience: e }; }); };
  const upEdu = (i: number, k: keyof Education, v: string) => { markFormEdited(); setForm(f => { const e = [...f.education]; e[i] = { ...e[i], [k]: v }; return { ...f, education: e }; }); };
  const addExp = () => { markFormEdited(); setForm(f => ({ ...f, experience: [...f.experience, EMPTY_EXP()] })); };
  const delExp = (i: number) => { markFormEdited(); setForm(f => ({ ...f, experience: f.experience.filter((_, x) => x !== i) })); };
  const addEdu = () => { markFormEdited(); setForm(f => ({ ...f, education: [...f.education, EMPTY_EDU()] })); };
  const delEdu = (i: number) => { markFormEdited(); setForm(f => ({ ...f, education: f.education.filter((_, x) => x !== i) })); };
  const upProject = (
  i: number,
  key: keyof Project,
  value: string
) => {
  markFormEdited();

  setForm(prev => {
    const items = [...prev.projects];

    items[i] = {
      ...items[i],
      [key]: value,
    };

    return {
      ...prev,
      projects: items,
    };
  });
};

const addProject = () => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    projects: [
      ...prev.projects,
      EMPTY_PROJECT(),
    ],
  }));
};

const delProject = (i: number) => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    projects: prev.projects.filter(
      (_, index) => index !== i
    ),
  }));
};

const upCert = (
  i: number,
  key: keyof Certification,
  value: string
) => {
  markFormEdited();

  setForm(prev => {
    const items = [...prev.certifications];

    items[i] = {
      ...items[i],
      [key]: value,
    };

    return {
      ...prev,
      certifications: items,
    };
  });
};

const addCert = () => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    certifications: [
      ...prev.certifications,
      EMPTY_CERT(),
    ],
  }));
};

const delCert = (i: number) => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    certifications:
      prev.certifications.filter(
        (_, index) => index !== i
      ),
  }));
};

const upAchievement = (
  i: number,
  key: keyof Achievement,
  value: string
) => {
  markFormEdited();

  setForm(prev => {
    const items = [...prev.achievements];

    items[i] = {
      ...items[i],
      [key]: value,
    };

    return {
      ...prev,
      achievements: items,
    };
  });
};

const addAchievement = () => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    achievements: [
      ...prev.achievements,
      EMPTY_ACHIEVEMENT(),
    ],
  }));
};

const delAchievement = (i: number) => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    achievements:
      prev.achievements.filter(
        (_, index) => index !== i
      ),
  }));
};

const upVolunteer = (
  i: number,
  key: keyof VolunteerExperience,
  value: string
) => {
  markFormEdited();

  setForm(prev => {
    const items = [...prev.volunteer];

    items[i] = {
      ...items[i],
      [key]: value,
    };

    return {
      ...prev,
      volunteer: items,
    };
  });
};

const addVolunteer = () => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    volunteer: [
      ...prev.volunteer,
      EMPTY_VOLUNTEER(),
    ],
  }));
};

const delVolunteer = (i: number) => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    volunteer:
      prev.volunteer.filter(
        (_, index) => index !== i
      ),
  }));
};

const upLanguage = (
  i: number,
  key: keyof Language,
  value: string
) => {
  markFormEdited();

  setForm(prev => {
    const items = [...prev.languages];

    items[i] = {
      ...items[i],
      [key]: value,
    };

    return {
      ...prev,
      languages: items,
    };
  });
};

const addLanguage = () => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    languages: [
      ...prev.languages,
      EMPTY_LANGUAGE(),
    ],
  }));
};

const delLanguage = (i: number) => {
  markFormEdited();

  setForm(prev => ({
    ...prev,
    languages:
      prev.languages.filter(
        (_, index) => index !== i
      ),
  }));
};
  const applySummaryTemplate = (id: SummaryTemplateId) => {
    setF('summary', buildSummaryTemplate(form, id));
    toast('Summary template applied.', 'info');
  };

  const appendBulletTemplate = (index: number, id: BulletTemplateId) => {
    const current = form.experience[index]?.desc.trim();
    const nextLine = buildBulletTemplate(form.experience[index], id);
    upExp(index, 'desc', current ? `${current}\n${nextLine}` : nextLine);
  };

  const applySkillPreset = (id: SkillPresetId) => {
    setF('skills', mergeSkills(form.skills, id));
    toast('Skill pack added.', 'info');
  };

  const appendAchievementTemplate = (id: AchievementTemplateId) => {
    const template = ACHIEVEMENT_TEMPLATES.find(item => item.id === id)?.text;
    if (!template) return;
    markFormEdited();
    setForm(prev => ({
      ...prev,
      achievements: [
        ...prev.achievements,
        { title: template, organization: '', date: '', description: '' },
      ],
    }));
  };

  const requirePro = (action: () => void) => { if (!isPro) { setShowUpgrade(true); return; } action(); };

  // ── Improve bullet ────────────────────────────────────────────────────────
  const improveBullet = async (expIdx: number) => {
    const exp = form.experience[expIdx];
    if (!exp.desc.trim()) return;
    setImprovingIdx(`${expIdx}-0`);
    try {
      const res = await fetch('/api/improve-bullet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bullet: exp.desc, role: exp.role, company: exp.company }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      upExp(expIdx, 'desc', data.improved);
      toast('Bullet improved! ✓', 'ok');
    } catch (e: unknown) {
      toast(getAIErrorMessage(e, 'Failed to improve bullet.'), 'err');
    } finally { setImprovingIdx(null); }
  };

  const generateResume = async () => {
    if (!form.name && !form.title) { toast('Please fill in your name and job title.', 'err'); return; }
    setLoading(true); toast('AI is crafting your resume…', 'info', 8000);
    try {
      const res = await fetch('/api/generate-resume', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResume(normalizeResume(data.resume, form)); setRightPanel('preview');
      toast('Resume generated! ✓', 'ok');
    } catch (e: unknown) {
      toast(getAIErrorMessage(e, 'Failed to generate. Please try again.'), 'err', 5000);
    } finally { setLoading(false); }
  };

  const generateCoverLetter = async () => {
    if (!usableResume) { toast('Fill in your resume details first.', 'err'); return; }
    setCoverLoading(true);
    try {
      const res = await fetch('/api/generate-cover-letter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resume: usableResume, jobDescription: jobDesc, companyName, hiringManager: hiringMgr }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCoverLetter(data.coverLetter); setRightPanel('cover');
      toast('Cover letter generated! ✓', 'ok');
    } catch (e: unknown) {
      toast(getAIErrorMessage(e, 'Failed to generate cover letter.'), 'err', 5000);
    } finally { setCoverLoading(false); }
  };

  const handleCopy = () => {
    if (!usableResume) return;
    navigator.clipboard.writeText(copyAsText(usableResume));
    setCopyDone(true); setTimeout(() => setCopyDone(false), 2000);
  };

  const exportBackup = () => {
    downloadProjectBackup({
      version: 1,
      exportedAt: new Date().toISOString(),
      form,
      resume,
      coverLetter,
      template,
    });
    setExportOpen(false);
    toast('Editable backup downloaded.', 'ok');
  };

  const importBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const backup = await readProjectBackup(file);
      const nextForm = normalizeForm(backup.form);
      setForm(nextForm);
      setResume(normalizeResume(backup.resume, nextForm));
      setCoverLetter(backup.coverLetter);
      if (TEMPLATES.some(item => item.id === backup.template)) {
        setTemplate(backup.template as TemplateId);
      }
      setRightPanel('preview');
      toast('Backup imported.', 'ok');
    } catch (error) {
      console.error('Failed to import backup:', error);
      toast('Could not import that backup file.', 'err');
    }
  };

  const clearAll = () => {
    localStorage.removeItem('resume-form'); localStorage.removeItem('resume-output');
    setForm(EMPTY_FORM()); setResume(null); setCoverLetter('');
    toast('Cleared.', 'info');
  };

  // ── Saved CVs ─────────────────────────────────────────────────────────────
  const handleSaveCV = async (name: string) => {
    if (!user) { toast('Sign in to save CVs.', 'err'); return; }
    setSavingCV(true);
    try {
      const cv: SavedCV = {
        id: Date.now().toString(),
        name,
        resume: resume ?? formToResume(form),
        formData: form,
        ...(coverLetter ? { coverLetter } : {}),
        updatedAt: Date.now(),
      };
      await saveCV(user.uid, cv);
      await refreshProfile();
      toast(`"${name}" saved! ✓`, 'ok');
    } catch (error) {
      console.error('Failed to save CV:', error);
      toast('Failed to save CV.', 'err');
    }
    finally { setSavingCV(false); }
  };

  const handleDeleteCV = async (id: string) => {
    if (!user) return;
    try { await deleteCV(user.uid, id); await refreshProfile(); toast('CV deleted.', 'info'); }
    catch { toast('Failed to delete.', 'err'); }
  };

  // ── Load CV back into form ────────────────────────────────────────────────
  const handleLoadCV = (cv: SavedCV) => {
    const nextForm = cv.formData ? normalizeForm(cv.formData) : null;
    setResume(normalizeResume(cv.resume, nextForm ?? undefined));
    // Restore form data if saved — this is the key feature
    if (cv.formData) {
      if (nextForm) setForm(nextForm);
      toast(`Loaded "${cv.name}" — form and preview restored.`, 'ok');
    } else {
      toast(`Loaded "${cv.name}" — preview restored.`, 'ok');
    }
    if (cv.coverLetter) setCoverLetter(cv.coverLetter);
    setRightPanel('preview');
  };

  const handleUpgrade = () => { alert('Payment coming soon! Contact us to upgrade.'); };

  const referralLink = user ? `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${user.uid.slice(0, 8)}` : '';
  const copyReferral = () => { navigator.clipboard.writeText(referralLink); setReferralCopied(true); setTimeout(() => setReferralCopied(false), 2000); };

  const liveResume = resume ?? formToResume(form);
  const usableResume = hasResumeContent(liveResume) ? liveResume : null;
  const coachInsights = analyzeResume(usableResume);
  const TemplateComponent = TEMPLATE_MAP[template];
  const showPhotoControls = template === 'photo-sidebar';
  const savedCVs = profile?.cvs ?? [];
  const words = resumeWordCount(liveResume);
  const lengthInfo = resumeLengthLabel(words);
  const quickScore = computeQuickScore(liveResume);
  const scoreColor = quickScore >= 80 ? '#4ade80' : quickScore >= 60 ? '#fbbf24' : '#f87171';
  const a4FitColor = coachInsights.a4Fit.status === 'balanced' ? '#4ade80' : coachInsights.a4Fit.status === 'dense' ? '#fbbf24' : '#f87171';

  const focusCoachSection = (section: InsightSection) => {
    if (section === 'ats') {
      setRightPanel('ats');
      return;
    }

    const tabBySection: Record<Exclude<InsightSection, 'ats'>, number> = {
      basics: 0,
      experience: 1,
      education: 2,
      skills: 3,
    };
    setActiveTab(tabBySection[section]);
  };

  // ── Style tokens ──────────────────────────────────────────────────────────
  const D = dark;
  const bg = D ? '#111827' : '#f9fafb';
  const cardBg = D ? '#1f2937' : '#ffffff';
  const cardBorder = D ? '#374151' : '#e5e7eb';
  const subtleBg = D ? '#374151' : '#f3f4f6';
  const textPrimary = D ? '#f9fafb' : '#111827';
  const textSec = D ? '#9ca3af' : '#6b7280';
  const textMuted = D ? '#6b7280' : '#9ca3af';

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 13, borderRadius: 12, border: `1px solid ${cardBorder}`, background: D ? '#111827' : '#fff', color: textPrimary, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 500, color: textSec, marginBottom: 6, marginTop: 12 };
  const secCard: React.CSSProperties = { background: D ? '#111827' : '#f9fafb', border: `1px solid ${cardBorder}`, borderRadius: 16, padding: 16, marginBottom: 12 };
  const chipBtn: React.CSSProperties = { fontSize: 11, padding: '5px 9px', borderRadius: 8, border: `1px solid ${cardBorder}`, background: subtleBg, color: textSec, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 };

  const progressItems = [
    { label: 'Basics', filled: !!(form.name || form.title) },
    { label: 'Experience', filled: form.experience.some(e => e.company) },
    { label: 'Education', filled: form.education.some(e => e.institution) },
    { label: 'Skills', filled: !!(form.skills) },
  ];
  // ── Basics (name, title, email, phone, location, linkedin) ──
  const basicsFields: [string, string][] = [
    ['name', form.name],
    ['title', form.title],
    ['email', form.email],
    ['phone', form.phone],
    ['location', form.location],
    ['linkedin', form.linkedin],
    ['portfolio', form.portfolio],
    ['github', form.github],
  ];
  const basicsFilled = basicsFields.filter(([, v]) => v.trim()).length;
  const basicsPct = Math.round((basicsFilled / basicsFields.length) * 100);
  const missingBasics = basicsFields.filter(([, v]) => !v.trim()).map(([label]) => label);

  // ── Experience ──
  const hasFilledExperience = form.experience.some(e => e.company.trim() && e.role.trim());
  const workBulletsCount = form.experience.reduce(
    (sum, e) => sum + (e.desc ? e.desc.split('\n').filter(line => line.trim()).length : 0),
    0
  );
  const experiencePct = Math.round(
    (hasFilledExperience ? 50 : 0) + Math.min(50, Math.round((workBulletsCount / 6) * 50))
  );

  // ── Education ──
  const filledEduCount = form.education.filter(e => e.institution.trim() && e.degree.trim()).length;
  const educationPct = filledEduCount > 0 ? 100 : 0;

  // ── Skills / Languages / Projects / Certifications ──
  const skillsCount = splitList(form.skills).length;
  const skillsPct = Math.min(
    100,
    Math.round((skillsCount / 6) * 100)
  );

  const languagesCount = form.languages.filter(
    language => language.name.trim()
  ).length;

  const languagesPct =
    languagesCount > 0 ? 100 : 0;

  const projectsCount = form.projects.filter(
    project => project.name.trim()
  ).length;

  const projectsPct = Math.min(
    100,
    projectsCount * 50
  );

  const certificationsCount =
    form.certifications.filter(cert =>
      cert.name.trim()
    ).length;

  const certificationsPct = Math.min(
    100,
    certificationsCount * 50
  );

  const sectionCompletionItems: {
    label: string;
    pct: number;
    tab: number;
    missing: string;
  }[] = [
      {
        label: 'Basics',
        pct: basicsPct,
        tab: 0,
        missing: missingBasics.length
          ? `Basics: add ${missingBasics.join(', ')}`
          : '',
      },

      {
        label: 'Experience',
        pct: experiencePct,
        tab: 1,
        missing:
          !hasFilledExperience && projectsCount === 0
            ? 'Add experience or projects'
            : workBulletsCount < 3 && hasFilledExperience
              ? 'Add a few achievement bullets'
              : '',
      },

      {
        label: 'Education',
        pct: educationPct,
        tab: 2,
        missing:
          filledEduCount === 0
            ? 'Add an institution & degree'
            : '',
      },

      {
        label: 'Skills',
        pct: skillsPct,
        tab: 3,
        missing:
          skillsCount < 6
            ? `Add ${6 - skillsCount} more skill${6 - skillsCount === 1 ? '' : 's'}`
            : '',
      },

      {
        label: 'Languages',
        pct: languagesPct,
        tab: 3,
        missing: '',
      },

      {
        label: 'Projects',
        pct: projectsPct,
        tab: 3,
        missing: '',
      },

      {
        label: 'Certifications',
        pct: certificationsPct,
        tab: 3,
        missing: '',
      },
    ];

  const overallCompletion = Math.round(
    sectionCompletionItems.reduce(
      (sum, item) => sum + item.pct,
      0
    ) / sectionCompletionItems.length
  );

  const completionColor =
    overallCompletion >= 80
      ? '#16a34a'
      : overallCompletion >= 40
        ? '#d97706'
        : '#dc2626';

  const missingItems =
    sectionCompletionItems.filter(item => item.missing);
  if (!mounted) return null;

  return (
    <main id="main-content" className="app-shell" style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', background: bg, color: textPrimary, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <style>{`
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0;
    overflow: hidden;
    max-width: 100vw;
  }

  body {
    position: relative;
  }

  * {
    box-sizing: border-box;
  }

  input:focus,
  textarea:focus,
  select:focus {
    border-color: #1D4ED8 !important;
    box-shadow:
      0 0 0 3px rgba(29,78,216,0.15) !important;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes modalIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes toastIn {
    from {
      opacity: 0;
      transform: translateX(60px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background:
      ${D ? '#374151' : '#e5e7eb'};
    border-radius: 99px;
  }

  .app-shell {
    height: 100svh !important;
    min-height: 100svh !important;
    max-height: 100svh !important;
    overflow: hidden !important;
  }

  .body-wrap {
    height: calc(100svh - 53px) !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  .left-panel {
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  .right-panel {
    height: 100% !important;
    min-height: 0 !important;
    overflow: hidden !important;
  }

  .editor-scroll {
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  .panel-content {
    flex: 1 !important;
    min-height: 0 !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
  }

  .resume-preview-shell {
    width: 100%;
    min-height: 100%;
  }

  .hov-red:hover {
    color: #f87171 !important;
  }

  .hov-teal:hover {
    background:
      rgba(29,78,216,0.10) !important;
  }

  .hov-row:hover {
    background:
      ${D
          ? 'rgba(55,65,81,0.5)'
          : '#f9fafb'} !important;
  }

  .hov-tab:hover {
    opacity: 0.8;
  }

  .print-preview-sheet #resume-output {
    min-height: 297mm !important;
    border-radius: 0 !important;
  }

  @media print {
    .no-print {
      display: none !important;
    }

    body {
      background: white !important;
      overflow: visible !important;
    }
  }

  @media (max-width: 768px) {
    html,
    body {
      overflow: auto;
    }

    .app-shell {
      height: auto !important;
      min-height: 100svh !important;
      max-height: none !important;
      overflow: visible !important;
    }

    .body-wrap {
      height: auto !important;
      overflow: visible !important;
      flex-direction: column !important;
    }

    .left-panel,
    .right-panel {
      width: 100% !important;
      min-width: 0 !important;
      height: auto !important;
      overflow: visible !important;
      border-right: none !important;
    }

    .editor-scroll,
    .panel-content {
      overflow: visible !important;
    }

    .header-pills,
    .word-pill {
      display: none !important;
    }
  }
`}</style>
      <input ref={backupInputRef} type="file" accept="application/json,.json" aria-label="Import project backup" onChange={importBackup} style={{ display: 'none' }} />

      {/* ── TOAST CONTAINER ── */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} role={t.type === 'err' ? 'alert' : 'status'} style={{
            padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 500,
            background: t.type === 'err' ? '#ef4444' : t.type === 'info' ? (D ? '#374151' : '#1f2937') : '#1D4ED8',
            color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            animation: 'toastIn 0.25s ease', maxWidth: 320,
            display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto',
          }}>
            <span>{t.type === 'err' ? '⚠' : t.type === 'info' ? 'ℹ' : '✓'}</span>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── PRINT VIEW ── */}
      {showPrintView && (
        <div style={{ position: 'fixed', inset: 0, background: '#f9fafb', zIndex: 200, overflowY: 'auto' }}>
          <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>Print Preview</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>🖨 Print</button>
              <button onClick={() => setShowPrintView(false)} style={{ padding: '8px 16px', background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Close</button>
            </div>
          </div>
          <div className="print-preview-sheet" style={{ padding: '0 24px 40px' }}>
            <TemplateComponent resume={liveResume} dark={false} />
          </div>
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="app-header no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: `1px solid ${cardBorder}`, background: cardBg, flexShrink: 0, zIndex: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 38, height: 30, borderRadius: 8, background: '#fff', border: `1px solid ${cardBorder}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <img src={BRAND.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.35)' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 14, color: textPrimary, letterSpacing: 0 }}>
            <span style={{ color: BRAND.red }}>Nep</span><span style={{ color: BRAND.blue }}>Astra</span>
          </span>
        </div>

        {/* Progress pills — hidden on mobile */}
        <div className="header-pills" style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
          {progressItems.map(({ label, filled }) => (
            <span key={label} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, background: filled ? 'rgba(29,78,216,0.15)' : subtleBg, color: filled ? '#1D4ED8' : textMuted, border: `1px solid ${filled ? 'rgba(29,78,216,0.3)' : cardBorder}` }}>
              {filled ? '✓ ' : ''}{label}
            </span>
          ))}
        </div>

        <div className="header-actions" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Word count + ATS score — hidden on mobile */}
          <div className="word-pill" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span suppressHydrationWarning style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, fontWeight: 500, background: subtleBg, color: textMuted, border: `1px solid ${cardBorder}`, overflowX: 'hidden' }}>
              {words}w · <span style={{ color: lengthInfo.color, fontWeight: 600 }}>{lengthInfo.label}</span>
            </span>
            {/* ATS score badge on preview tab */}
            <button type="button" style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: subtleBg, color: scoreColor, border: `1px solid ${cardBorder}`, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setRightPanel('ats')} title="Click to view full ATS analysis" aria-label={`Open ATS analysis, current quick score ${quickScore}`}>
              ⚡ {quickScore}
            </button>
          </div>

          {/* Auto-save indicator */}
          {autoSaveLabel && (
            <span style={{ fontSize: 11, color: '#1D4ED8', fontWeight: 500 }}>{autoSaveLabel}</span>
          )}

          {isPro && <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: 'rgba(29,78,216,0.15)', color: '#1D4ED8', border: '1px solid rgba(29,78,216,0.3)' }}>✦ Pro</span>}

          <button type="button" onClick={() => setDark(d => !d)} aria-label={D ? 'Switch to light mode' : 'Switch to dark mode'} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 9, fontSize: 12, fontWeight: 500, border: `1px solid ${cardBorder}`, background: subtleBg, color: textSec, cursor: 'pointer', fontFamily: 'inherit' }}>
            {D ? '☀' : '🌙'}
          </button>

          {!isPro && <button onClick={() => setShowUpgrade(true)} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: 'none', background: '#1D4ED8', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>✦ Pro</button>}

          {user && <button onClick={() => setShowReferral(true)} style={{ fontSize: 12, padding: '5px 10px', borderRadius: 8, border: `1px solid ${cardBorder}`, background: 'transparent', color: textSec, cursor: 'pointer', fontFamily: 'inherit' }}>🎁</button>}

          {user ? (
            <div style={{ position: 'relative' }}>
              <button type="button" onClick={() => setShowUserMenu(m => !m)} aria-haspopup="menu" aria-expanded={showUserMenu} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9, border: `1px solid ${cardBorder}`, background: subtleBg, color: textSec, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 700 }}>
                  {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
                </div>
                <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName ?? user.email?.split('@')[0]}</span>
              </button>
              {showUserMenu && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowUserMenu(false)} />
                  <div role="menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, zIndex: 20, background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', overflow: 'hidden', minWidth: 200 }}>
                    <div style={{ padding: '12px 16px', borderBottom: `1px solid ${cardBorder}` }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: textPrimary }}>{user.displayName ?? 'User'}</p>
                      <p style={{ margin: 0, fontSize: 11, color: textSec }}>{user.email}</p>
                      {isPro && <span style={{ fontSize: 10, color: '#1D4ED8', fontWeight: 600 }}>✦ Pro member</span>}
                    </div>
                    <button onClick={() => { setShowUserMenu(false); setRightPanel('saved'); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', fontFamily: 'inherit' }}>💾 My saved CVs</button>
                    <button onClick={() => { setShowUserMenu(false); setShowReferral(true); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, background: 'transparent', border: 'none', color: textPrimary, cursor: 'pointer', fontFamily: 'inherit' }}>🎁 Refer a friend</button>
                    {!isPro && <button onClick={() => { setShowUserMenu(false); setShowUpgrade(true); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, background: 'transparent', border: 'none', color: '#1D4ED8', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>✦ Upgrade to Pro</button>}
                    <button onClick={async () => { await signOut(auth); setShowUserMenu(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 12, background: 'transparent', border: 'none', borderTop: `1px solid ${cardBorder}`, color: '#f87171', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button onClick={() => router.push('/auth')} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 8, border: `1px solid ${cardBorder}`, background: 'transparent', color: textSec, cursor: 'pointer', fontFamily: 'inherit' }}>👤 Login</button>
          )}
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="body-wrap" style={{ display: 'flex', flex: 1, overflowX: 'visible', overflowY: 'hidden', height: 'calc(100svh - 53px)', minHeight: 0 }}>

        {/* ══ LEFT PANEL ══ */}
        <div className="left-panel" style={{ width: 360, minWidth: 300, minHeight: 0, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${cardBorder}`, background: cardBg, flexShrink: 0 }}>
          <div className="editor-tabs" role="tablist" aria-label="Resume editor sections" style={{ display: 'flex', padding: '10px 10px 8px', gap: 3, borderBottom: `1px solid ${cardBorder}`, flexShrink: 0, overflowX: 'auto' }}>
            {LEFT_TABS.map((t, i) => (
              <button key={t} type="button" role="tab" aria-selected={activeTab === i} onClick={() => setActiveTab(i)} className="hov-tab" style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: activeTab === i ? '#1D4ED8' : 'transparent', color: activeTab === i ? '#fff' : textSec, whiteSpace: 'nowrap' }}>
                {t}
              </button>
            ))}
          </div>
          <div
            style={{
              margin: '7px 12px',
              padding: '8px 10px',
              borderRadius: 11,
              border: `1px solid ${cardBorder}`,
              background: D
                ? 'rgba(29,78,216,0.08)'
                : '#EFF6FF',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 5,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.3,
                }}
              >
                Resume completion
              </span>

              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: completionColor,
                }}
              >
                {overallCompletion}%
              </span>
            </div>

            <div
              style={{
                height: 5,
                borderRadius: 99,
                background: D ? '#1f2937' : '#dbeafe',
                overflow: 'hidden',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: `${overallCompletion}%`,
                  height: '100%',
                  background: completionColor,
                  borderRadius: 99,
                  transition: 'width 0.25s ease',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 4,
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {sectionCompletionItems
                .filter(item =>
                  ['Basics', 'Experience', 'Education', 'Skills']
                    .includes(item.label)
                )
                .map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setActiveTab(item.tab)}
                    style={{
                      border: 'none',
                      background:
                        item.pct >= 100
                          ? 'rgba(22,163,74,0.10)'
                          : subtleBg,
                      color:
                        item.pct >= 100
                          ? '#16a34a'
                          : textSec,
                      borderRadius: 6,
                      padding: '3px 6px',
                      fontSize: 8.5,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {item.pct >= 100 ? '✓ ' : ''}
                    {item.label}
                    {item.pct > 0 && item.pct < 100
                      ? ` ${item.pct}%`
                      : ''}
                  </button>
                ))}
            </div>

            {missingItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setShowMissingItems(value => !value)
                  }
                  style={{
                    marginTop: 5,
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    color: textMuted,
                    fontSize: 9,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  ⚠ {missingItems.length} remaining{' '}
                  {showMissingItems ? '▴' : '▾'}
                </button>

                {showMissingItems && (
                  <div
                    style={{
                      marginTop: 5,
                      paddingTop: 5,
                      borderTop:
                        `1px dashed ${cardBorder}`,
                    }}
                  >
                    {missingItems.map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() =>
                          setActiveTab(item.tab)
                        }
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '2px 0',
                          border: 'none',
                          background: 'transparent',
                          textAlign: 'left',
                          color: BRAND.blue,
                          fontSize: 9,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        <span
                          style={{
                            color: '#dc2626',
                            marginRight: 4,
                            fontWeight: 700,
                          }}
                        >
                          •
                        </span>
                        {item.missing}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="editor-scroll" style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {activeTab === 0 && (
              <div style={{ animation: 'fadeIn 0.15s ease' }}>
                <input ref={photoInputRef} type="file" accept="image/*" aria-label="Upload profile photo" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                {showPhotoControls && (
                  <div style={{ ...secCard, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: D ? '#374151' : '#e5e7eb', border: `2px solid ${cardBorder}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: textMuted, fontSize: 22, fontWeight: 700, flexShrink: 0 }}>
                      {form.photo ? <img src={form.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : form.name.trim().charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: textPrimary }}>Profile photo</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => photoInputRef.current?.click()} style={chipBtn}>{form.photo ? 'Change photo' : 'Upload photo'}</button>
                        {form.photo && <button type="button" onClick={() => setF('photo', '')} style={chipBtn}>Remove</button>}
                      </div>
                    </div>
                  </div>
                )}
                <label style={lbl}>Full name <span style={{ color: '#1D4ED8' }}>*</span></label>
                <input style={inp} aria-label="Full name" placeholder="Jane Smith" value={form.name} onChange={e => setF('name', e.target.value)} />
                <label style={lbl}>Job title <span style={{ color: '#1D4ED8' }}>*</span></label>
                <input style={inp} aria-label="Job title" placeholder="Senior Product Manager" value={form.title} onChange={e => setF('title', e.target.value)} />
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={lbl}>Email</label><input style={inp} aria-label="Email" type="email" placeholder="jane@email.com" value={form.email} onChange={e => setF('email', e.target.value)} /></div>
                  <div><label style={lbl}>Phone</label><input style={inp} aria-label="Phone" placeholder="+1 555 000 0000" value={form.phone} onChange={e => setF('phone', e.target.value)} /></div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={lbl}>Location</label><input style={inp} aria-label="Location" placeholder="New York, USA" value={form.location} onChange={e => setF('location', e.target.value)} /></div>
                  <div><label style={lbl}>LinkedIn</label><input style={inp} aria-label="LinkedIn" placeholder="linkedin.com/in/jane" value={form.linkedin} onChange={e => setF('linkedin', e.target.value)} /></div>
                </div>
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={lbl}>Portfolio</label><input style={inp} aria-label="Portfolio" placeholder="janesmith.dev" value={form.portfolio} onChange={e => setF('portfolio', e.target.value)} /></div>
                  <div><label style={lbl}>GitHub</label><input style={inp} aria-label="GitHub" placeholder="github.com/janesmith" value={form.github} onChange={e => setF('github', e.target.value)} /></div>
                </div>
                <label style={{ ...lbl, marginTop: 12 }}>Summary <span style={{ color: textMuted, fontWeight: 400 }}>— optional</span></label>
                <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder="Paste an existing summary or leave blank…" value={form.summary} onChange={e => setF('summary', e.target.value)} />
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: textMuted, fontWeight: 600, textTransform: 'uppercase' }}>Templates</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {SUMMARY_TEMPLATES.map(item => <button key={item.id} type="button" onClick={() => applySummaryTemplate(item.id)} style={chipBtn}>{item.label}</button>)}
                  </div>
                </div>
              </div>
            )}

{activeTab === 1 && (
                  <div style={{ animation: 'fadeIn 0.15s ease' }}>
                    {form.experience.map((exp, i) => (
                      <div key={i} style={secCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0, color: textMuted }}>Position {i + 1}</span>
                          {form.experience.length > 1 && <button onClick={() => delExp(i)} className="hov-red" style={{ fontSize: 11, color: textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Remove</button>}
                        </div>
                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Company"
                            value={exp.company}
                            onChange={e =>
                              upExp(i, 'company', e.target.value)
                            }
                          />

                          <input
                            style={inp}
                            placeholder="Role / title"
                            value={exp.role}
                            onChange={e =>
                              upExp(i, 'role', e.target.value)
                            }
                          />
                        </div>

                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Location"
                            value={exp.location}
                            onChange={e =>
                              upExp(i, 'location', e.target.value)
                            }
                          />

                          <select
                            style={inp}
                            value={exp.employmentType}
                            onChange={e =>
                              upExp(
                                i,
                                'employmentType',
                                e.target.value
                              )
                            }
                          >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                            <option value="Temporary">Temporary</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Start date"
                            value={exp.start}
                            onChange={e =>
                              upExp(i, 'start', e.target.value)
                            }
                          />

                          <input
                            style={inp}
                            placeholder={
                              exp.current ? 'Present' : 'End date'
                            }
                            value={
                              exp.current
                                ? 'Present'
                                : exp.end
                            }
                            disabled={exp.current}
                            onChange={e =>
                              upExp(i, 'end', e.target.value)
                            }
                          />
                        </div>

                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            marginTop: 8,
                            fontSize: 11,
                            color: textSec,
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={e => {
                              markFormEdited();

                              setForm(prev => {
                                const items = [...prev.experience];

                                items[i] = {
                                  ...items[i],
                                  current: e.target.checked,
                                  end: e.target.checked
                                    ? ''
                                    : items[i].end,
                                };

                                return {
                                  ...prev,
                                  experience: items,
                                };
                              });
                            }}
                          />

                          I currently work here
                        </label>
                        <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                          <input style={inp} aria-label={`Start date for position ${i + 1}`} placeholder="Start (e.g. Jan 2021)" value={exp.start} onChange={e => upExp(i, 'start', e.target.value)} />
                          <input style={inp} aria-label={`End date for position ${i + 1}`} placeholder="End (or Present)" value={exp.end} onChange={e => upExp(i, 'end', e.target.value)} />
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                            <label style={{ ...lbl, marginTop: 0, marginBottom: 0 }}>Key achievements <span style={{ color: textMuted, fontWeight: 400 }}>— one per line</span></label>
                            {isPro && (
                              <button onClick={() => improveBullet(i)} disabled={improvingIdx === `${i}-0` || !exp.desc.trim()} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 7, border: `1px solid rgba(29,78,216,0.4)`, background: 'transparent', color: '#1D4ED8', cursor: !exp.desc.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4, opacity: !exp.desc.trim() ? 0.5 : 1 }}>
                                {improvingIdx === `${i}-0` ? <Spin sm /> : '✦'} AI
                              </button>
                            )}
                          </div>
                          <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.7, minHeight: 76 }} aria-label={`Key achievements for position ${i + 1}`} rows={3} placeholder={'Led team of 5 to deliver on time\nIncreased conversion 23% via A/B testing\nReduced costs by $50k'} value={exp.desc} onChange={e => upExp(i, 'desc', e.target.value)} />
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                            {BULLET_TEMPLATES.map(item => (
                              <button key={item.id} type="button" onClick={() => appendBulletTemplate(i, item.id)} style={chipBtn}>
                                + {item.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    <button onClick={addExp} className="hov-teal" style={{ fontSize: 13, border: `1px solid rgba(29,78,216,0.4)`, borderRadius: 12, padding: '8px 16px', color: '#1D4ED8', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6, transition: 'background 0.15s' }}>
                      <span style={{ fontSize: 16 }}>+</span> Add position
                    </button>
                  </div>
                )}

                {activeTab === 2 && (
                  <div style={{ animation: 'fadeIn 0.15s ease' }}>
                    {form.education.map((edu, i) => (
                      <div key={i} style={secCard}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0, color: textMuted }}>Education {i + 1}</span>
                          {form.education.length > 1 && <button onClick={() => delEdu(i)} className="hov-red" style={{ fontSize: 11, color: textMuted, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Remove</button>}
                        </div>
                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Institution"
                            value={edu.institution}
                            onChange={e =>
                              upEdu(
                                i,
                                'institution',
                                e.target.value
                              )
                            }
                          />

                          <input
                            style={inp}
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={e =>
                              upEdu(i, 'degree', e.target.value)
                            }
                          />
                        </div>

                        <input
                          style={{ ...inp, marginTop: 8 }}
                          placeholder="Field of study"
                          value={edu.field}
                          onChange={e =>
                            upEdu(i, 'field', e.target.value)
                          }
                        />

                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Location"
                            value={edu.location}
                            onChange={e =>
                              upEdu(i, 'location', e.target.value)
                            }
                          />

                          <input
                            style={inp}
                            placeholder="GPA (optional)"
                            value={edu.gpa}
                            onChange={e =>
                              upEdu(i, 'gpa', e.target.value)
                            }
                          />
                        </div>

                        <div
                          className="form-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 8,
                            marginTop: 8,
                          }}
                        >
                          <input
                            style={inp}
                            placeholder="Start year"
                            value={edu.start}
                            onChange={e =>
                              upEdu(i, 'start', e.target.value)
                            }
                          />

                          <input
                            style={inp}
                            placeholder="Graduation year"
                            value={edu.end}
                            onChange={e =>
                              upEdu(i, 'end', e.target.value)
                            }
                          />
                        </div>

                        <textarea
                          style={{
                            ...inp,
                            marginTop: 8,
                            resize: 'vertical',
                          }}
                          rows={2}
                          placeholder="Relevant coursework"
                          value={edu.coursework}
                          onChange={e =>
                            upEdu(i, 'coursework', e.target.value)
                          }
                        />

                        <textarea
                          style={{
                            ...inp,
                            marginTop: 8,
                            resize: 'vertical',
                          }}
                          rows={2}
                          placeholder="Academic achievements"
                          value={edu.achievements}
                          onChange={e =>
                            upEdu(
                              i,
                              'achievements',
                              e.target.value
                            )
                          }
                        />
                      </div>
                    ))}
                    <button onClick={addEdu} className="hov-teal" style={{ fontSize: 13, border: `1px solid rgba(29,78,216,0.4)`, borderRadius: 12, padding: '8px 16px', color: '#1D4ED8', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 16 }}>+</span> Add education
                    </button>
                  </div>
                )}

                {activeTab === 3 && (
                  <div style={{ animation: 'fadeIn 0.15s ease' }}>
                    <div style={secCard}>
                      <label style={{ ...lbl, marginTop: 0 }}>Skills <span style={{ color: textMuted, fontWeight: 400 }}>— comma separated</span></label>
                      <textarea style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }} rows={3} placeholder="Python, SQL, Figma, Leadership…" value={form.skills} onChange={e => setF('skills', e.target.value)} />
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {SKILL_PRESETS.map(item => <button key={item.id} type="button" onClick={() => applySkillPreset(item.id)} style={chipBtn}>+ {item.label}</button>)}
                      </div>
                    </div>

                    <div style={secCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Languages</span>
                        <button type="button" onClick={addLanguage} style={chipBtn}>+ Add</button>
                      </div>
                      {form.languages.map((language, i) => (
                        <div key={i} className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8, alignItems: 'end' }}>
                          <div><label style={lbl}>Language</label><input style={inp} placeholder="English" value={language.name} onChange={e => upLanguage(i, 'name', e.target.value)} /></div>
                          <div><label style={lbl}>Proficiency</label><select style={inp} value={language.level} onChange={e => upLanguage(i, 'level', e.target.value)}><option value="">Select level</option><option>Native</option><option>Fluent</option><option>Advanced</option><option>Proficient</option><option>Intermediate</option><option>Basic</option></select></div>
                          <button type="button" onClick={() => delLanguage(i)} className="hov-red" style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', paddingBottom: 10 }}>Remove</button>
                        </div>
                      ))}
                    </div>

                    <div style={secCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 700 }}>Projects</span><button type="button" onClick={addProject} style={chipBtn}>+ Add</button></div>
                      {form.projects.map((project, i) => (
                        <div key={i} style={{ borderTop: i ? `1px solid ${cardBorder}` : 'none', marginTop: i ? 12 : 8, paddingTop: i ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: textMuted }}>Project {i + 1}</span><button type="button" onClick={() => delProject(i)} className="hov-red" style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 11 }}>Remove</button></div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Name</label><input style={inp} value={project.name} placeholder="Project name" onChange={e => upProject(i, 'name', e.target.value)} /></div>
                            <div><label style={lbl}>Role</label><input style={inp} value={project.role} placeholder="Developer" onChange={e => upProject(i, 'role', e.target.value)} /></div>
                          </div>
                          <label style={lbl}>Description</label><textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={project.description} placeholder="What you built or achieved…" onChange={e => upProject(i, 'description', e.target.value)} />
                          <label style={lbl}>Technologies</label><input style={inp} value={project.technologies} placeholder="React, Next.js, Firebase" onChange={e => upProject(i, 'technologies', e.target.value)} />
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Start</label><input style={inp} value={project.start} onChange={e => upProject(i, 'start', e.target.value)} /></div>
                            <div><label style={lbl}>End</label><input style={inp} value={project.end} onChange={e => upProject(i, 'end', e.target.value)} /></div>
                          </div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>URL</label><input style={inp} value={project.url} placeholder="example.com/project" onChange={e => upProject(i, 'url', e.target.value)} /></div>
                            <div><label style={lbl}>GitHub</label><input style={inp} value={project.github} placeholder="github.com/..." onChange={e => upProject(i, 'github', e.target.value)} /></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={secCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 700 }}>Certifications</span><button type="button" onClick={addCert} style={chipBtn}>+ Add</button></div>
                      {form.certifications.map((cert, i) => (
                        <div key={i} style={{ borderTop: i ? `1px solid ${cardBorder}` : 'none', marginTop: i ? 12 : 8, paddingTop: i ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: textMuted }}>Certification {i + 1}</span><button type="button" onClick={() => delCert(i)} className="hov-red" style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 11 }}>Remove</button></div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Name</label><input style={inp} value={cert.name} placeholder="Certification name" onChange={e => upCert(i, 'name', e.target.value)} /></div>
                            <div><label style={lbl}>Issuer</label><input style={inp} value={cert.issuer} placeholder="Issuer" onChange={e => upCert(i, 'issuer', e.target.value)} /></div>
                          </div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Date</label><input style={inp} value={cert.date} placeholder="2026" onChange={e => upCert(i, 'date', e.target.value)} /></div>
                            <div><label style={lbl}>Credential ID</label><input style={inp} value={cert.credentialId} onChange={e => upCert(i, 'credentialId', e.target.value)} /></div>
                          </div>
                          <label style={lbl}>URL</label><input style={inp} value={cert.url} placeholder="https://…" onChange={e => upCert(i, 'url', e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <div style={secCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 700 }}>Awards & Achievements</span><button type="button" onClick={addAchievement} style={chipBtn}>+ Add</button></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>{ACHIEVEMENT_TEMPLATES.map(item => <button key={item.id} type="button" onClick={() => appendAchievementTemplate(item.id)} style={chipBtn}>+ {item.label}</button>)}</div>
                      {form.achievements.map((achievement, i) => (
                        <div key={i} style={{ borderTop: i ? `1px solid ${cardBorder}` : 'none', marginTop: i ? 12 : 8, paddingTop: i ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: textMuted }}>Achievement {i + 1}</span><button type="button" onClick={() => delAchievement(i)} className="hov-red" style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 11 }}>Remove</button></div>
                          <label style={lbl}>Title</label><input style={inp} value={achievement.title} placeholder="Achievement title" onChange={e => upAchievement(i, 'title', e.target.value)} />
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Organization</label><input style={inp} value={achievement.organization} onChange={e => upAchievement(i, 'organization', e.target.value)} /></div>
                            <div><label style={lbl}>Date</label><input style={inp} value={achievement.date} onChange={e => upAchievement(i, 'date', e.target.value)} /></div>
                          </div>
                          <label style={lbl}>Description</label><textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={achievement.description} onChange={e => upAchievement(i, 'description', e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <div style={secCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12, fontWeight: 700 }}>Volunteer Experience</span><button type="button" onClick={addVolunteer} style={chipBtn}>+ Add</button></div>
                      {form.volunteer.map((item, i) => (
                        <div key={i} style={{ borderTop: i ? `1px solid ${cardBorder}` : 'none', marginTop: i ? 12 : 8, paddingTop: i ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 11, color: textMuted }}>Volunteer role {i + 1}</span><button type="button" onClick={() => delVolunteer(i)} className="hov-red" style={{ border: 'none', background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 11 }}>Remove</button></div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Organization</label><input style={inp} value={item.organization} onChange={e => upVolunteer(i, 'organization', e.target.value)} /></div>
                            <div><label style={lbl}>Role</label><input style={inp} value={item.role} onChange={e => upVolunteer(i, 'role', e.target.value)} /></div>
                          </div>
                          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div><label style={lbl}>Location</label><input style={inp} value={item.location} onChange={e => upVolunteer(i, 'location', e.target.value)} /></div>
                            <div><label style={lbl}>Start</label><input style={inp} value={item.start} onChange={e => upVolunteer(i, 'start', e.target.value)} /></div>
                          </div>
                          <label style={lbl}>End</label><input style={inp} value={item.end} onChange={e => upVolunteer(i, 'end', e.target.value)} />
                          <label style={lbl}>Description / bullets</label><textarea style={{ ...inp, resize: 'vertical' }} rows={3} value={item.desc} onChange={e => upVolunteer(i, 'desc', e.target.value)} />
                        </div>
                      ))}
                    </div>

                    <div style={secCard}>
                      <label style={{ ...lbl, marginTop: 0 }}>Hobbies <span style={{ color: textMuted, fontWeight: 400 }}>— optional</span></label>
                      <input style={inp} value={form.hobbies} placeholder="Writing, Cricket, Music" onChange={e => setF('hobbies', e.target.value)} />
                    </div>
                  </div>
                )}

              </div>

          {/* Buttons */}
            <div style={{ padding: '12px 14px', borderTop: `1px solid ${cardBorder}`, display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0, background: cardBg }}>
              <button onClick={() => requirePro(generateResume)} disabled={loading} style={{ width: '100%', padding: '10px 0', borderRadius: 11, border: 'none', background: loading ? '#93C5FD' : '#1D4ED8', color: '#fff', fontSize: 13, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: loading ? 0.8 : 1, transition: 'background 0.15s', fontFamily: 'inherit' }}>
                {loading ? <><Spinner light /> Generating…</> : isPro ? '✦ Enhance with AI' : '🔒 Enhance with AI (Pro)'}
              </button>
              <button onClick={() => setRightPanel('cover')} style={{ width: '100%', padding: '8px 0', borderRadius: 11, border: `1px solid rgba(29,78,216,0.5)`, background: 'transparent', color: '#1D4ED8', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', fontFamily: 'inherit' }}>
                ✉ Cover letter tools
              </button>
              <button onClick={clearAll} style={{ width: '100%', padding: '7px 0', borderRadius: 11, border: `1px solid ${cardBorder}`, background: 'transparent', color: textMuted, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                Clear all
              </button>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="right-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'visible', overflowY: 'hidden', background: bg }}>
            <div
              className="right-toolbar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 14px',
                borderBottom: `1px solid ${cardBorder}`,
                background: cardBg,
                flexShrink: 0,
                gap: 6,
                flexWrap: 'wrap',
                overflow: 'visible',
                position: 'relative',
                zIndex: 1000
              }}
            >
              <div className="panel-tabs" role="tablist" aria-label="Resume workspace panels" style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {RIGHT_PANELS.map(p => {
                  const locked = !isPro && p.id !== 'preview' && p.id !== 'coach' && p.id !== 'saved';
                  const isActive = rightPanel === p.id;
                  return (
                    <button key={p.id} type="button" role="tab" aria-selected={isActive} aria-disabled={locked} onClick={() => locked ? setShowUpgrade(true) : setRightPanel(p.id)} className="hov-tab"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: isActive ? '#1D4ED8' : 'transparent', color: isActive ? '#fff' : textSec, opacity: locked ? 0.6 : 1, position: 'relative' }}>
                      <span style={{ fontSize: 11 }}>{locked ? '🔒' : p.icon}</span>
                      {p.label}
                      {/* ATS score badge on the ATS tab */}
                      {p.id === 'ats' && !locked && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: isActive ? 'rgba(255,255,255,0.25)' : scoreColor, color: isActive ? '#fff' : '#fff', marginLeft: 2 }}>
                          {quickScore}
                        </span>
                      )}
                      {p.id === 'coach' && !locked && (
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: isActive ? 'rgba(255,255,255,0.25)' : coachInsights.exportReady ? '#1D4ED8' : '#fbbf24', color: '#fff', marginLeft: 2 }}>
                          {coachInsights.score}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {rightPanel === 'preview' && (
                <div
                  className="preview-actions"
                  style={{
                    display: 'flex',
                    gap: 5,
                    alignItems: 'center',

                    position: 'relative',
                    zIndex: 9999
                  }}
                >
                  <button onClick={() => setRightPanel('coach')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 9, border: `1px solid ${cardBorder}`, background: subtleBg, color: a4FitColor, cursor: 'pointer', fontFamily: 'inherit' }}>
                    A4 {coachInsights.a4Fit.label}
                  </button>
                  <div style={{ flexShrink: 0 }}>
                    <button
                      ref={templateButtonRef}
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={showTemplates}
                      onClick={() => { closeExport(); setShowTemplates(o => !o); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9, border: `1px solid ${cardBorder}`, background: subtleBg, color: textSec, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    >
                      Templates: {TEMPLATES.find(t => t.id === template)?.label} ▾
                    </button>
                    <FloatingMenu open={showTemplates} anchorRef={templateButtonRef} onClose={closeTemplates} surface={cardBg} border={cardBorder} label="Resume templates" width={216}>
                      {TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          role="menuitemradio"
                          aria-checked={template === t.id}
                          onClick={() => { setTemplate(t.id); closeTemplates(); }}
                          className="hov-row"
                          style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', gap: 9, background: template === t.id ? 'rgba(29,78,216,0.10)' : 'transparent', color: textPrimary, cursor: 'pointer', fontFamily: 'inherit', border: 'none' }}
                        >
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 11, color: template === t.id ? BRAND.blue : textPrimary }}>{t.label} {template === t.id ? '✓' : ''}</p>
                            <p style={{ margin: 0, fontSize: 9, color: textMuted }}>{t.desc}</p>
                          </div>
                        </button>
                      ))}
                    </FloatingMenu>
                  </div>
                  <button onClick={() => setShowPrintView(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 500, borderRadius: 9, border: `1px solid ${cardBorder}`, background: subtleBg, color: textSec, cursor: 'pointer', fontFamily: 'inherit' }}>🖨</button>
                  <div style={{ flexShrink: 0 }}>
                    <button
                      ref={exportButtonRef}
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={exportOpen}
                      onClick={() => { closeTemplates(); setExportOpen(o => !o); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12, fontWeight: 600, borderRadius: 9, border: 'none', background: BRAND.blue, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                    >
                      Export ▾
                    </button>
                    <FloatingMenu open={exportOpen} anchorRef={exportButtonRef} onClose={closeExport} surface={cardBg} border={cardBorder} label="Export options" width={220}>
                      {[
                        {
                          label: 'Download PDF',
                          action: () => {
                            const safeName = (liveResume.name || 'resume').replace(/\s+/g, '_');
                            downloadPDF('resume-output', `${safeName}_resume.pdf`);
                            closeExport();
                          },
                        },
                        {
                          label: 'Download Word (.docx)',
                          action: () => {
                            downloadDOCX(liveResume);
                            closeExport();
                          },
                        },
                        {
                          label: 'Download HTML',
                          action: () => {
                            downloadHTML(liveResume);
                            closeExport();
                          },
                        },
                        {
                          label: copyDone ? 'Copied!' : 'Copy as text',
                          action: () => {
                            handleCopy();
                            closeExport();
                          },
                        },
                        {
                          label: 'Backup editable project',
                          action: exportBackup,
                        },
                        {
                          label: 'Import backup',
                          action: () => {
                            backupInputRef.current?.click();
                            closeExport();
                          },
                        },
                      ].map(item => (
                        <button
                          key={item.label}
                          type="button"
                          role="menuitem"
                          onClick={item.action}
                          className="hov-row"
                          style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderRadius: 8, background: 'transparent', cursor: 'pointer', color: textPrimary, fontSize: 12, fontFamily: 'inherit' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </FloatingMenu>
                  </div>
                </div>
              )}
            </div>

            <div className="panel-content" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              {rightPanel === 'preview' && (
                <div className="resume-preview-shell">
                  <TemplateComponent resume={liveResume} dark={dark} />
                </div>
              )}
              {rightPanel === 'coach' && <ResumeCoachPanel resume={usableResume} dark={dark} onFocusSection={focusCoachSection} onOpenAts={() => setRightPanel('ats')} onOpenTailor={() => setRightPanel('tailor')} />}
              {rightPanel === 'saved' && (user ? <SavedCVsPanel cvs={savedCVs} dark={dark} onLoad={handleLoadCV} onDelete={handleDeleteCV} onSave={handleSaveCV} saving={savingCV} currentResume={resume} currentForm={form} /> : <SignInPrompt textPrimary={textPrimary} textSec={textSec} onSignIn={() => router.push('/auth')} />)}
              {rightPanel === 'tailor' && <TailorPanel resume={usableResume} dark={dark} onTailored={r => { setResume(normalizeResume(r, form)); setRightPanel('preview'); toast('Resume tailored! ✓', 'ok'); }} />}
              {rightPanel === 'cover' && <CoverLetterPanel coverLetter={coverLetter} resume={usableResume} jobDesc={jobDesc} setJobDesc={setJobDesc} companyName={companyName} setCompanyName={setCompanyName} hiringManager={hiringMgr} setHiringManager={setHiringMgr} onGenerate={generateCoverLetter} onUseDraft={text => { setCoverLetter(text); setRightPanel('cover'); toast('Cover letter draft applied.', 'info'); }} loading={coverLoading} dark={dark} />}
              {rightPanel === 'ats' && <ATSScorePanel resume={usableResume} dark={dark} />}
              {rightPanel === 'linkedin' && <LinkedInPanel resume={usableResume} dark={dark} />}
            </div>
          </div>
        </div>

        {/* ── UPGRADE MODAL ── */}
        {showUpgrade && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={() => setShowUpgrade(false)} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 101, background: cardBg, borderRadius: 24, padding: '36px 32px', width: 420, maxWidth: '90vw', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', animation: 'modalIn 0.2s ease', border: `1px solid ${cardBorder}` }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(29,78,216,0.12)', border: '1px solid rgba(29,78,216,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>✦</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: textPrimary }}>Upgrade to Pro</h2>
              <p style={{ color: textSec, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Manual resume building and saving is always free. Unlock AI features with Pro.</p>
              <div style={{ textAlign: 'left', background: D ? '#111827' : '#f9fafb', borderRadius: 14, padding: '16px 20px', marginBottom: 24, border: `1px solid ${cardBorder}` }}>
                {['✦ AI-written bullet points', '✦ AI improve single bullets', '🎯 Tailor resume to any job', '✉ Cover letter generator', '⚡ ATS score analysis', '🔗 LinkedIn About writer'].map(f => (
                  <div key={f} style={{ fontSize: 13, color: textSec, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: '#1D4ED8' }}>✓</span> {f}
                  </div>
                ))}
              </div>
              <button onClick={handleUpgrade} style={{ width: '100%', padding: '13px 0', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>Upgrade — $9 / month</button>
              <button onClick={() => setShowUpgrade(false)} style={{ background: 'none', border: 'none', color: textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Maybe later</button>
            </div>
          </>
        )}

        {/* ── REFERRAL MODAL ── */}
        {showReferral && (
          <>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100 }} onClick={() => setShowReferral(false)} />
            <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 101, background: cardBg, borderRadius: 24, padding: '36px 32px', width: 400, maxWidth: '90vw', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.4)', animation: 'modalIn 0.2s ease', border: `1px solid ${cardBorder}` }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎁</div>
              <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: textPrimary }}>Refer a Friend</h2>
              <p style={{ color: textSec, fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>Share NepAstra with a friend. When they sign up using your link, both of you get 1 month Pro free.</p>
              <div style={{ background: D ? '#111827' : '#f3f4f6', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 12, color: textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{referralLink}</span>
                <button onClick={copyReferral} style={{ flexShrink: 0, padding: '6px 14px', background: referralCopied ? '#1D4ED8' : cardBg, color: referralCopied ? '#fff' : textSec, border: `1px solid ${cardBorder}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                  {referralCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <button onClick={() => setShowReferral(false)} style={{ background: 'none', border: 'none', color: textMuted, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
            </div>
          </>
        )}
    </main>
  );
}

function Spinner({ light }: { light?: boolean }) {
  return <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', border: '2px solid', borderColor: light ? 'rgba(255,255,255,0.3)' : '#e5e7eb', borderTopColor: light ? '#fff' : '#1D4ED8', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function Spin({ sm }: { sm?: boolean }) {
  const s = sm ? 10 : 14;
  return <span style={{ display: 'inline-block', width: s, height: s, borderRadius: '50%', border: '2px solid rgba(29,78,216,0.3)', borderTopColor: '#1D4ED8', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />;
}

function SignInPrompt({ textPrimary, textSec, onSignIn }: { textPrimary: string; textSec: string; onSignIn: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', maxWidth: 360, margin: '0 auto' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>💾</div>
      <p style={{ fontSize: 15, fontWeight: 600, color: textPrimary, marginBottom: 8 }}>Sign in to save your CVs</p>
      <p style={{ fontSize: 13, color: textSec, marginBottom: 20, lineHeight: 1.6 }}>Create a free account to save and access your CVs from anywhere.</p>
      <button onClick={onSignIn} style={{ padding: '10px 24px', background: '#1D4ED8', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Sign in / Sign up</button>
    </div>
  );
}
