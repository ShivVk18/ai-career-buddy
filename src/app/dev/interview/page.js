import { notFound } from "next/navigation";
import DevInterview from "./DevInterview";

export const metadata = { title: "interview demo" };

// Dev-only: interview practice with mock actions. 404 in production builds.
// ?mode=setup (default) | resume | loading | error | empty
export default async function Page({ searchParams }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { mode = "setup" } = await searchParams;
  return <DevInterview mode={mode} />;
}
