import type { Experience, FormData, ResumeOutput } from './types';

export type SummaryTemplateId = 'impact' | 'technical' | 'leadership' | 'career-change' | 'graduate' | 'project';
export type BulletTemplateId = 'impact' | 'leadership' | 'process' | 'customer' | 'technical' | 'metric';
export type SkillPresetId = 'software' | 'product' | 'marketing' | 'operations' | 'data' | 'design' | 'sales';
export type AchievementTemplateId = 'certification' | 'launch' | 'award' | 'improvement' | 'portfolio' | 'training';

export const SUMMARY_TEMPLATES: { id: SummaryTemplateId; label: string }[] = [
  { id: 'impact', label: 'Impact' },
  { id: 'technical', label: 'Technical' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'career-change', label: 'Career shift' },
  { id: 'graduate', label: 'Graduate' },
  { id: 'project', label: 'Project led' },
];

export const BULLET_TEMPLATES: { id: BulletTemplateId; label: string }[] = [
  { id: 'impact', label: 'Impact' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'process', label: 'Process' },
  { id: 'customer', label: 'Customer' },
  { id: 'technical', label: 'Technical' },
  { id: 'metric', label: 'Metric' },
];

export const SKILL_PRESETS: { id: SkillPresetId; label: string; skills: string[] }[] = [
  { id: 'software', label: 'Software', skills: ['JavaScript', 'TypeScript', 'React', 'Next.js', 'APIs', 'Testing', 'Git', 'Problem solving'] },
  { id: 'product', label: 'Product', skills: ['Roadmapping', 'User research', 'Analytics', 'Prioritization', 'Stakeholder management', 'A/B testing', 'Agile', 'Go-to-market'] },
  { id: 'marketing', label: 'Marketing', skills: ['Campaign strategy', 'SEO', 'Content marketing', 'Email marketing', 'Analytics', 'Brand positioning', 'Copywriting', 'Lead generation'] },
  { id: 'operations', label: 'Operations', skills: ['Process improvement', 'Vendor management', 'Reporting', 'Budgeting', 'Cross-functional coordination', 'Quality control', 'Scheduling', 'Documentation'] },
  { id: 'data', label: 'Data', skills: ['SQL', 'Python', 'Dashboards', 'Data cleaning', 'Reporting', 'A/B testing', 'Forecasting', 'Stakeholder insights'] },
  { id: 'design', label: 'Design', skills: ['Figma', 'Wireframing', 'Prototyping', 'Design systems', 'User research', 'Accessibility', 'Interaction design', 'Usability testing'] },
  { id: 'sales', label: 'Sales', skills: ['Prospecting', 'CRM', 'Pipeline management', 'Negotiation', 'Account management', 'Discovery calls', 'Forecasting', 'Customer success'] },
];

export const ACHIEVEMENT_TEMPLATES: { id: AchievementTemplateId; label: string; text: string }[] = [
  { id: 'certification', label: 'Certification', text: 'Earned a relevant certification to strengthen professional knowledge and practical delivery.' },
  { id: 'launch', label: 'Launch', text: 'Launched a project or process improvement that supported team goals and better execution.' },
  { id: 'award', label: 'Award', text: 'Recognized for dependable work quality, ownership, and positive contribution to team outcomes.' },
  { id: 'improvement', label: 'Improvement', text: 'Improved a workflow by identifying gaps, simplifying steps, and supporting more consistent results.' },
  { id: 'portfolio', label: 'Portfolio', text: 'Built a portfolio project to demonstrate practical skills and solve a real user or business problem.' },
  { id: 'training', label: 'Training', text: 'Completed relevant training and applied the learning to stronger, more organized project work.' },
];

const fallback = (value: string | undefined, text: string) => value?.trim() || text;
const cleanList = (items: string[]) => items.map(item => item.trim()).filter(Boolean);

function firstSkills(form: FormData, count = 4): string {
  const skills = cleanList(form.skills.split(',')).slice(0, count);
  return skills.length ? skills.join(', ') : 'communication, execution, problem solving, and collaboration';
}

function currentExperience(form: FormData): Experience | undefined {
  return form.experience.find(exp => exp.company || exp.role || exp.desc);
}

export function buildSummaryTemplate(form: FormData, templateId: SummaryTemplateId): string {
  const title = fallback(form.title, 'professional');
  const location = form.location.trim();
  const exp = currentExperience(form);
  const roleContext = exp?.role || title;
  const companyContext = exp?.company ? ` at ${exp.company}` : '';
  const skills = firstSkills(form);
  const locationText = location ? ` based in ${location}` : '';

  if (templateId === 'technical') {
    return `${title}${locationText} with practical experience in ${skills}. Strong at turning requirements into reliable solutions, documenting trade-offs clearly, and improving workflows so teams can deliver with fewer blockers.`;
  }

  if (templateId === 'leadership') {
    return `${title}${locationText} experienced in guiding priorities, coordinating stakeholders, and moving work from planning to delivery. Brings strengths in ${skills}, clear communication, and steady execution across team goals.`;
  }

  if (templateId === 'career-change') {
    return `Adaptable ${title}${locationText} bringing experience as ${roleContext}${companyContext} and strengths in ${skills}. Combines fast learning, structured problem solving, and clear communication to contribute quickly in a new environment.`;
  }

  if (templateId === 'graduate') {
    return `Motivated ${title}${locationText} with a foundation in ${skills} and a strong interest in building useful, well-organized work. Brings curiosity, attention to detail, and a practical approach to learning quickly in professional settings.`;
  }

  if (templateId === 'project') {
    return `${title}${locationText} with experience contributing to projects from planning through delivery${companyContext}. Skilled in ${skills}, with a focus on organizing work, solving problems, and communicating progress clearly.`;
  }

  return `Results-focused ${title}${locationText} with experience as ${roleContext}${companyContext}. Skilled in ${skills}, improving processes, supporting teams, and delivering work that connects day-to-day execution with measurable outcomes.`;
}

export function buildBulletTemplate(exp: Experience, templateId: BulletTemplateId): string {
  const role = fallback(exp.role, 'role');
  const area = exp.company ? `at ${exp.company}` : 'for the team';

  if (templateId === 'leadership') {
    return `Led day-to-day coordination ${area}, helping the team deliver priorities on time.`;
  }

  if (templateId === 'process') {
    return `Improved ${role} workflows by organizing tasks, reducing delays, and making handoffs clearer.`;
  }

  if (templateId === 'customer') {
    return `Supported customers and stakeholders by resolving issues quickly and communicating next steps clearly.`;
  }

  if (templateId === 'technical') {
    return `Built or improved tools and workflows ${area}, reducing manual work and improving reliability.`;
  }

  if (templateId === 'metric') {
    return `Improved performance by tracking results, acting on feedback, and refining the process over time.`;
  }

  return `Delivered useful results ${area} by taking ownership, solving blockers, and following through.`;
}

export function mergeSkills(existingSkills: string, preset: SkillPresetId): string {
  const presetSkills = SKILL_PRESETS.find(item => item.id === preset)?.skills ?? [];
  const merged = [...cleanList(existingSkills.split(',')), ...presetSkills];
  const unique = [...new Map(merged.map(skill => [skill.toLowerCase(), skill])).values()];
  return unique.join(', ');
}

export function buildCoverLetterDraft(resume: ResumeOutput, companyName: string, hiringManager: string, jobDesc: string): string {
  const company = companyName.trim() || 'your company';
  const manager = hiringManager.trim() || 'Hiring Manager';
  const title = resume.title || 'the role';
  const skillText = resume.skills?.slice(0, 5).join(', ') || 'relevant skills';
  const firstRole = resume.experience?.[0];
  const achievement = firstRole?.bullets?.[0] || resume.achievements?.[0] || 'delivered reliable results across projects and team priorities';
  const jobLine = jobDesc.trim()
    ? `The role stood out to me because it calls for strengths that match my background, especially ${skillText}.`
    : `I am drawn to the opportunity to bring my background in ${skillText} to your team.`;

  return `Dear ${manager},

I am excited to apply for ${title} at ${company}. ${jobLine}

In my recent work${firstRole ? ` as ${firstRole.role || resume.title} at ${firstRole.company}` : ''}, I ${achievement.replace(/\.$/, '')}. I would bring the same practical, outcome-focused approach to ${company}, along with strengths in ${skillText}.

Thank you for your time and consideration. I would welcome the chance to discuss how my experience can support your team.`;
}

export function buildLinkedInAboutDraft(resume: ResumeOutput): string {
  const title = resume.title || 'professional';
  const skillText = resume.skills?.slice(0, 6).join(', ') || 'problem solving, communication, and execution';
  const firstRole = resume.experience?.[0];
  const achievement = firstRole?.bullets?.[0] || resume.achievements?.[0];

  return `I am a ${title} focused on turning ideas, requirements, and team goals into practical results. My work sits at the intersection of ${skillText}, and I enjoy building clear systems that help people move faster and make better decisions.

${achievement ? `One achievement I am proud of: ${achievement.replace(/\.$/, '')}. ` : ''}${firstRole ? `Most recently, I worked as ${firstRole.role || title} at ${firstRole.company}, where I contributed across execution, collaboration, and continuous improvement.` : 'I bring a flexible, hands-on approach and a strong interest in learning from every project.'}

I am always interested in thoughtful teams, useful products, and work that creates measurable value.`;
}

export function extractJobKeywords(jobDescription: string, resume: ResumeOutput | null): string[] {
  const stopWords = new Set([
    'about', 'after', 'also', 'and', 'are', 'but', 'can', 'for', 'from', 'have', 'into', 'our', 'that', 'the', 'this', 'with', 'will', 'you', 'your',
    'ability', 'across', 'based', 'business', 'candidate', 'company', 'experience', 'including', 'looking', 'preferred', 'required', 'responsibilities',
  ]);
  const resumeText = JSON.stringify(resume ?? {}).toLowerCase();
  const words = jobDescription
    .toLowerCase()
    .replace(/[^a-z0-9+#. ]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  const counts = new Map<string, number>();
  for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);

  return [...counts.entries()]
    .filter(([word]) => !resumeText.includes(word))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([word]) => word);
}
