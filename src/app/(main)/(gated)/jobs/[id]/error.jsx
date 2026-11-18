"use client";

import Image from "next/image";
import Link from "next/link";

export default function JobError({ reset }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Image src="/pip/pip-coffee.svg" alt="" width={96} height={96} unoptimized style={{ imageRendering: "pixelated" }} />
      <h2 className="text-lg font-semibold text-text">We couldn't open this job</h2>
      <p className="max-w-md text-sm text-muted">Something went wrong on our side. Your job is safe.</p>
      <div className="flex gap-3">
        <button type="button" onClick={() => reset()} className="btn-pill-primary min-h-11 px-6 text-sm">
          Retry
        </button>
        <Link href="/dashboard" className="btn-pill-secondary min-h-11 px-6 text-sm inline-flex items-center">
          Back to home
        </Link>
      </div>
    </div>
  );
}
