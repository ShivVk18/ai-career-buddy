"use client";

import PageError from "@/components/shared/PageError";

export default function NeedsYouError({ reset }) {
  return <PageError title="We couldn't open your review list" reset={reset} />;
}
