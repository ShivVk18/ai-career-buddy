// Server-side session access. `auth()` keeps the shape the actions already use: { userId } where userId is the
// DB User.id (from the Auth.js JWT), or null when signed out.
import { auth as authjs } from "@/auth";

export async function auth() {
  const session = await authjs();
  return { userId: session?.user?.id ?? null };
}
