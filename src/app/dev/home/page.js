import { notFound } from "next/navigation";
import DevHome from "./DevHome";

export const metadata = { title: "home demo" };

// Dev-only: renders the home view with mock home-state data. 404 in production builds.
// ?mode=empty (new user) | loading | error. Paste a link into the input to see the optimistic card.
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "seeded" } = await searchParams;
  return <DevHome mode={mode} />;
}
