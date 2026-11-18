"use client";

import PageError from "@/components/shared/PageError";

export default function SettingsError({ reset }) {
  return <PageError title="We couldn't open settings" reset={reset} />;
}
