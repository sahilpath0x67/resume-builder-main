export interface Experience {
  company: string;
  role: string;
  location: string;
  employmentType: string;
  start: string;
  end: string;
  current: boolean;
  desc: string;
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  location: string;
  start: string;
  end: string;
  gpa: string;
  coursework: string;
  achievements: string;
}

export interface Project {
  name: string;
  description: string;
  role: string;
  technologies: string;
  start: string;
  end: string;
  url: string;
  github: string;
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
  credentialId: string;
  url: string;
}

export interface Achievement {
  title: string;
  organization: string;
  date: string;
  description: string;
}

export interface VolunteerExperience {
  organization: string;
  role: string;
  location: string;
  start: string;
  end: string;
  desc: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface FormData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;

  linkedin: string;
  portfolio: string;
  github: string;
  photo: string;

  summary: string;

  skills: string;
  languages: Language[];
  hobbies: string;

  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  achievements: Achievement[];
  volunteer: VolunteerExperience[];
}

export interface ResumeOutput {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;

  linkedin: string;
  portfolio: string;
  github: string;

  photo?: string;
  summary: string;

  experience: {
    company: string;
    role: string;
    location?: string;
    employmentType?: string;
    period: string;
    bullets: string[];
  }[];

  education: {
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    period: string;
    gpa?: string;
    coursework?: string[];
    achievements?: string[];
  }[];

  projects: {
    name: string;
    description?: string;
    role?: string;
    technologies?: string[];
    period?: string;
    url?: string;
    github?: string;
    bullets?: string[];
  }[];

  skills: string[];

  languages: {
    name: string;
    level?: string;
  }[];

  certifications: {
    name: string;
    issuer?: string;
    date?: string;
    credentialId?: string;
    url?: string;
  }[];

  achievements: {
    title: string;
    organization?: string;
    date?: string;
    description?: string;
  }[];

  volunteer: {
    organization: string;
    role: string;
    location?: string;
    period?: string;
    bullets?: string[];
  }[];

  hobbies: string[];
}