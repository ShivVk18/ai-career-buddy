import Link from "next/link"
import ColdEmailPreview from "../_components/ColdEmailPreview"
import { getColdEmail } from "@/actions/ColdEmail"
import { generationErrorMessage } from "@/components/shared/generationError"
import ToolFrame from "@/components/shared/ToolFrame"
import EmptyState from "@/components/ui/EmptyState"

export default async function EditColdEmailPage({ params }) {
  const { id } = await params
  const result = await getColdEmail(id)
  const loadError = !result || result.error ? result : null
  const coldEmail = loadError ? null : result

  if (loadError !== null || !coldEmail) {
    return (
      <ToolFrame title="cold email" outfit="detective" back={{ href: "/cold-email", label: "your emails" }} bare>
        <EmptyState
          outfit="detective"
          title="i can't open that email"
          text={generationErrorMessage(loadError, "it may have been deleted.").toLowerCase()}
          action={<Link href="/cold-email" className="btn-ink inline-flex min-h-11 items-center px-5 text-sm">back to your emails</Link>}
        />
      </ToolFrame>
    )
  }

  return (
    <ColdEmailPreview
      title={[coldEmail?.jobTitle, coldEmail?.companyName].filter(Boolean).join(" at ").toLowerCase() || "your cold email"}
      id={coldEmail?.id}
      content={coldEmail?.content}
      sources={coldEmail?.sources ?? null}
      recipientName={coldEmail?.recipientName ?? ""}
      recipientRole={coldEmail?.recipientRole ?? ""}
      recipientEmail={coldEmail?.recipientEmail ?? ""}
      subject={coldEmail?.subject ?? ""}
      followUpAt={coldEmail?.followUpAt ? new Date(coldEmail.followUpAt).toISOString().slice(0, 10) : ""}
    />
  )
}
