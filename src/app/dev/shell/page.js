import { notFound } from "next/navigation";
import ShellDemo from "./ShellDemo";

export const metadata = { title: "shell demo" };

// Dev-only: renders the app shell with mock data. 404 in production builds.
export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return <ShellDemo />;
}
