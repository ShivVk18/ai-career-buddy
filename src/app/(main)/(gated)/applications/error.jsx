"use client";

import PageError from "@/components/shared/PageError";

export default function ApplicationsError({ reset }) {
  return <PageError title="We couldn't open your applications" reset={reset} />;
}
