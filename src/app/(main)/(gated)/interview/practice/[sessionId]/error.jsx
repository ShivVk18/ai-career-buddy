"use client";

import PageError from "@/components/shared/PageError";

export default function Error({ reset }) {
  return <PageError title="We couldn't open this practice review" reset={reset} />;
}
