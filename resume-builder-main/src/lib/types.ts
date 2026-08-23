export interface Experience {
  company: string;
  role: string;
  start: string;
  end: string;
  desc: string;
}

export interface Education {
  institution: string;
  degree: string;
  start: string;
  end: string;
}

export interface FormData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  photo: string;
  summary: string;
  skills: string;
  languages: string;
  hobbies: string;
  achievements: string;
  experience: Experience[];
  education: Education[];
}

export interface ResumeOutput {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  photo?: string;
  summary: string;
  experience: {
    company: string;
    role: string;
    period: string;
    bullets: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
  }[];
  skills: string[];
  languages: string[];
  hobbies: string[];
  achievements: string[];
}
