import { redirect } from "next/navigation";

// Old Clerk catch-all paths (for example /sign-in/sso-callback) land on the plain route.
export default function Page() {
  redirect("/sign-in");
}
