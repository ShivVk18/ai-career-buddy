"use client";

import Image from "next/image";
import Link from "next/link";

/** Route-level error state shared by every error.jsx: Pip, a plain message, Retry and a way home. */
export default function PageError({ title = "Something went wrong", message = "Something went wrong on our side. Your data is safe.", reset }) {
  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <Image src="/pip/pip-coffee.svg" alt="" width={96} height={96} unoptimized style={{ imageRendering: "pixelated" }} />
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="max-w-md text-sm text-muted">{message}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" onClick={() => reset()} className="btn-pill-primary min-h-11 px-6 text-sm">
          Retry
        </button>
        <Link href="/dashboard" className="btn-pill-secondary inline-flex min-h-11 items-center px-6 text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
