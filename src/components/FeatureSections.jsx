'use client'

import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "./ui/bento-grid";
import {
  IconClipboardCopy,
  IconFileBroken,
  IconSignature,
  IconBoxAlignRightFilled,
  IconTableColumn,
} from "@tabler/icons-react";
import { ColdEmailSkeleton, CoverLetterSkeleton, KeywordCheckerSkeleton, QuizSkeleton, ResumeMakerSkeleton, ResumeParserSkeleton, RoadmapSkeleton } from "./MicroAnimation";


const items = [
  {
    title: "Quiz",
    description: "Interactive AI quiz to test your knowledge.",
    header: <QuizSkeleton />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Resume Parser",
    description: "AI that extracts key data from resumes.",
    header: <ResumeParserSkeleton />,
    className: "md:col-span-1",
    icon: <IconFileBroken className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Resume Maker",
    description: "Create a perfect resume using AI.",
    header: <ResumeMakerSkeleton />,
    className: "md:col-span-1",
    icon: <IconSignature className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Cold Email",
    description: "Generate and send personalized cold emails.",
    header: <ColdEmailSkeleton />,
    className: "md:col-span-1",
    icon: <IconBoxAlignRightFilled className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Cover Letter",
    description: "AI writes professional cover letters for you.",
    header: <CoverLetterSkeleton />,
    className: "md:col-span-1",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Roadmap",
    description: "Track your career journey visually.",
    header: <RoadmapSkeleton />,
    className: "md:col-span-2",
    icon: <IconTableColumn className="h-4 w-4 text-neutral-500" />,
  },
  {
    title: "Keyword Checker",
    description: "Check if your resume includes the right keywords.",
    header: <KeywordCheckerSkeleton />,
    className: "md:col-span-1",
    icon: <IconClipboardCopy className="h-4 w-4 text-neutral-500" />,
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