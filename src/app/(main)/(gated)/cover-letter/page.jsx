import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCoverLetters } from "@/actions/CoverLetter";
import { getUserOnboardingStatus } from "@/actions/User";
import CoverLetterList from "./_components/CoverLetterList";
import ToolFrame from "@/components/shared/ToolFrame";

export default async function CoverLetterPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const coverLetters = await getCoverLetters();

  return (
    <ToolFrame
      title="cover letters"
      line="written from your real resume, one per job."
      outfit="wizard"
      bare
      action={
        <Link href="/cover-letter/new" className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Plus className="size-4" aria-hidden="true" /> new
        </Link>
      }
    >
      <CoverLetterList coverLetters={coverLetters} />
    </ToolFrame>
  );
}
