"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCoverLetter, restoreCoverLetter } from "@/actions/CoverLetter";
import DocList from "@/components/shared/DocList";
import { deleteWithUndo } from "@/components/shared/undoDelete";

export default function CoverLetterList({ coverLetters: all }) {
  const router = useRouter();
  const [hidden, setHidden] = useState(() => new Set());
  const coverLetters = (all || []).filter((l) => !hidden.has(l.id));
  const setHide = (id, on) =>
    setHidden((h) => {
      const n = new Set(h);
      if (on) n.add(id);
      else n.delete(id);
      return n;
    });

  const handleDelete = (letter) =>
    deleteWithUndo({
      name: "Cover letter",
      hide: () => setHide(letter.id, true),
      show: () => setHide(letter.id, false),
      remove: () => deleteCoverLetter(letter.id),
      restore: () => restoreCoverLetter(letter.id),
      done: () => router.refresh(),
    });

  return (
    <DocList items={coverLetters} basePath="/cover-letter" newHref="/cover-letter/new" noun="cover letter" outfit="wizard" emptyText="pick a job and pip writes it from your resume." onDelete={handleDelete} />
  );
}
