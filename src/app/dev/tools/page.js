import { notFound } from "next/navigation";
import DevTools from "./DevTools";

export const metadata = { title: "tools demo" };

// Dev-only: the six tools with mock data. 404 in production builds.
// ?tool=cover|cold|ats|ats-result|roadmap|roadmap-new|roadmap-empty|resume|hub|quiz|cold-preview|letter-preview|chat
// ?mode=ready (default) | busy | error | empty ; add &job=j1 to start the generators from a picked job
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { tool = "cover", mode = "ready" } = await searchParams;
  return <DevTools tool={tool} mode={mode} />;
}
