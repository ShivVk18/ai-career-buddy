import { notFound } from "next/navigation";
import DevBots from "./DevBots";

export const metadata = { title: "bots demo" };

// Dev-only: bots-working view with a mock status. 404 in production builds.
// ?mode=advance (steps through) | step1 | step3 | done | failed | loading | error
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "advance" } = await searchParams;
  return <DevBots mode={mode} />;
}
