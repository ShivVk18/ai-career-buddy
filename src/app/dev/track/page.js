import { notFound } from "next/navigation";
import DevTrack from "./DevTrack";

export const metadata = { title: "track demo" };

// Dev-only: applications board with mock data. 404 in production builds.
// ?mode=board (default) | loading | empty | error
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "board" } = await searchParams;
  return <DevTrack mode={mode} />;
}
