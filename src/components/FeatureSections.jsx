'use client'

import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconBoxAlignRightFilled,
  IconTableColumn,
  IconRobot,
  IconSearch,
} from "@tabler/icons-react";
import { ColdEmailSkeleton, CoverLetterSkeleton, KeywordCheckerSkeleton, QuizSkeleton, ResumeMakerSkeleton, ResumeParserSkeleton, RoadmapSkeleton } from "./MicroAnimation";


const items = [
  {
    title: "Mock Interview",
    description: "Practice with role-specific AI questions and get instant feedback.",
    header: <QuizSkeleton />,
    className: "md:col-span-2",
    icon: <IconRobot className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Resume Parser",
    description: "Extract key info from any resume instantly with AI precision.",
    header: <ResumeParserSkeleton />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Resume Builder",
    description: "Create an ATS-friendly resume that hiring managers will love.",
    header: <ResumeMakerSkeleton />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Cold Email",
    description: "Draft personalized outreach emails that actually get replies.",
    header: <ColdEmailSkeleton />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Cover Letter",
    description: "Write professional, tailored cover letters in just a few clicks.",
    header: <CoverLetterSkeleton />,
    className: "md:col-span-1",
    icon: <IconTableColumn className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "Career Roadmap",
    description: "Visual step-by-step guidance to reach your dream role.",
    header: <RoadmapSkeleton />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-muted-foreground" />,
  },
  {
    title: "ATS Keyword Checker",
    description: "Ensure your resume has the keywords it needs to pass the filter.",
    header: <KeywordCheckerSkeleton />,
    className: "md:col-span-1",
    icon: <IconSearch className="h-4 w-4 text-muted-foreground" />,
  },
];

//
// 🎯 MAIN COMPONENT
//
export function BentoGridAISection() {
  return (
    <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[20rem]">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          className={cn("[&>p:text-lg]", item.className)}
          icon={item.icon}
        />
      ))}
    </BentoGrid>
  );
}