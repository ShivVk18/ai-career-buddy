import Link from "next/link"
import { redirect } from "next/navigation";
import { Plus } from "lucide-react"
import { getUserOnboardingStatus } from "@/actions/User";
import ColdEmailList from "./_components/ColdEmailList"
import { getColdEmails } from "@/actions/ColdEmail"
import ToolFrame from "@/components/shared/ToolFrame"

export default async function ColdEmailPage() {
  const { isOnboarded } = await getUserOnboardingStatus();

  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const coldEmails = await getColdEmails()

  return (
    <ToolFrame
      title="cold emails"
      line="short notes to real people. you write nothing, you send everything."
      outfit="rocket"
      bare
      action={
        <Link href="/cold-email/new" className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <Plus className="size-4" aria-hidden="true" /> new
        </Link>
      }
    >
      <ColdEmailList coldEmails={coldEmails} />
    </ToolFrame>
  )
}
