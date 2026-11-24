"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteColdEmail, restoreColdEmail } from "@/actions/ColdEmail"
import DocList from "@/components/shared/DocList";
import { deleteWithUndo } from "@/components/shared/undoDelete"

export default function ColdEmailList({ coldEmails: all }) {
  const router = useRouter()
  const [hidden, setHidden] = useState(() => new Set())
  const coldEmails = (all || []).filter((e) => !hidden.has(e.id))
  const setHide = (id, on) =>
    setHidden((h) => {
      const n = new Set(h)
      if (on) n.add(id)
      else n.delete(id)
      return n
    })

  const handleDelete = (email) =>
    deleteWithUndo({
      name: "Cold email",
      hide: () => setHide(email.id, true),
      show: () => setHide(email.id, false),
      remove: () => deleteColdEmail(email.id),
      restore: () => restoreColdEmail(email.id),
      done: () => router.refresh(),
    })

  return (
    <DocList items={coldEmails} basePath="/cold-email" newHref="/cold-email/new" noun="cold email" outfit="rocket" emptyText="pick a job and pip writes a short note to the right person." onDelete={handleDelete} />
  );
}
