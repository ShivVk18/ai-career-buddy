import { redirect } from "next/navigation";

// Old Clerk catch-all paths land on the plain route.
export default function Page() {
  redirect("/sign-up");
}
