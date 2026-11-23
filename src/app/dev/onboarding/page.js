import { notFound } from "next/navigation";
import DevOnboarding from "./DevOnboarding";

export const metadata = { title: "onboarding (mock)" };

// Dev-only: 404 in production builds. Mock parse results, no auth, no database.
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { delay, fail, edit } = (await searchParams) || {};
  return <DevOnboarding delay={Number(delay) || 1200} fail={!!fail} editing={!!edit} />;
}
