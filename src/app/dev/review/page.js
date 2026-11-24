import { notFound } from "next/navigation";
import DevReview from "./DevReview";

export const metadata = { title: "review demo" };

// Dev-only: review screen with mock data. 404 in production builds.
// ?mode=ready | loading | error | empty | slow (commit takes 1.5s)
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "ready" } = await searchParams;
  return <DevReview mode={mode} />;
}
