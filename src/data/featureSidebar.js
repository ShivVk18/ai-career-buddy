import {
  BrainCircuit,
  Briefcase,
  LineChart,
  ScrollText,
  FileText,
  ClipboardList,
} from "lucide-react";

export const featuresCard = [
  {
    label: "Smart Resume Creation",
    href: "/resume",
    icon: (
      <ScrollText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Interview Preparation",
    href: "/interview",
    icon: (
      <Briefcase className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Cover Letter Generator",
    href: "/cover-letter",
    icon: (
      <FileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "AI-Powered Career Guidance",
    href: "/roadmap",
    icon: (
      <BrainCircuit className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  {
    label: "Resume Parser",
    href: "/resume-parser",
    icon: (
      <ClipboardList className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    ),
  },
  
];
