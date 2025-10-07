import {
  BrainCircuit,
  Briefcase,
  LineChart,
  ScrollText,
  LayoutDashboard,
  FileText,
  ClipboardList,
  Rocket,
} from "lucide-react";

export const featuresCard = [
 
  {
    icon: <ScrollText className="w-10 h-10 mb-4 text-primary" />,
    title: "Smart Resume Creation",
    description: "Generate ATS-optimized resumes with AI assistance.",
    link: "/resume",
  },
  {
    icon: <Briefcase className="w-10 h-10 mb-4 text-primary" />,
    title: "Interview Preparation",
    description:
      "Practice with role-specific questions and get instant feedback to improve your performance.",
    link: "/interview",
  },
  {
    icon: <FileText className="w-10 h-10 mb-4 text-primary" />,
    title: "Cover Letter Generator",
    description:
      "Craft professional, job-specific cover letters in seconds using AI suggestions.",
    link: "/cover-letter",
  },
  {
    icon: <BrainCircuit className="w-10 h-10 mb-4 text-primary" />,
    title: "AI-Powered Career Guidance",
    description:
      "Get personalized career advice and step-by-step roadmaps for your dream role.",
    link: "/roadmap",
  },
  
  {
    icon: <ClipboardList className="w-10 h-10 mb-4 text-primary" />,
    title: "Resume Parser",
    description:
      "Upload your resume and let AI extract key details to enhance your job profile.",
    link: "/resume-parser",
  },
  {
    icon: <LineChart className="w-10 h-10 mb-4 text-primary" />,
    title: "Industry Insights",
    description:
      "Stay ahead with real-time industry trends, salary data, and market analysis.",
    link: "/industry-insights",
  },
];


