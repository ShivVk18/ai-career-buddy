"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import { Chip } from "@/components/ui/Chip";

const fmt = (d) => {
  const t = new Date(d);
  return Number.isNaN(t.getTime()) ? "" : t.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
};

/** Saved letters / emails as quiet cards. Delete is one tap and undoable (handled by the caller). */
export default function DocList({ items, basePath, newHref, noun, outfit, emptyText, onDelete }) {
  if (!items?.length) {
    return (
      <EmptyState
        outfit={outfit}
        title={`no ${noun}s yet`}
        text={emptyText}
        action={
          <Link href={newHref} className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Plus className="size-4" aria-hidden="true" /> new {noun}
          </Link>
        }
      />
    );
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-label={`your ${noun}s`}>
      {items.map((it) => (
        <li key={it.id} className="group relative rounded-[20px] border border-line bg-panel p-5 shadow-card transition-colors hover:border-brand/60">
          <Link href={`${basePath}/${it.id}`} className="block rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <p className="truncate pr-12 font-doc text-lg text-text">{it.jobTitle || `untitled ${noun}`}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {it.companyName && <Chip value={it.companyName} editable={false} />}
              <span className="text-xs text-muted">{fmt(it.createdAt)}</span>
            </div>
            {it.jobDescription && <p className="mt-3 line-clamp-2 text-sm text-muted">{it.jobDescription}</p>}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(it)}
            aria-label={`delete ${noun} for ${it.jobTitle || "this job"}`}
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full text-faint outline-none hover:bg-gap-soft hover:text-gap-ink focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
