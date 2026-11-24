import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { authConfig } from "@/auth.config";
import { verifyPassword, dummyWork } from "@/lib/auth/password";
import { allow, ipFromHeaders } from "@/lib/auth/rateLimit";
import { normalizeEmail } from "@/lib/auth/email-address";

const credsSchema = z.object({ email: z.string().max(254), password: z.string().min(1).max(200) });

/** Email + password check. Same work and same (null) result for unknown email, no password set and wrong password. */
export async function authorizeCredentials(raw, request) {
  const parsed = credsSchema.safeParse(raw ?? {});
  if (!parsed.success) return null;
  const email = normalizeEmail(parsed.data.email);
  const ip = ipFromHeaders(request?.headers);
  if (!(await allow("signIn", { ip, email }))) return null;

  const user = await db.user.findUnique({ where: { email }, select: { id: true, email: true, name: true, passwordHash: true } });
  if (!user?.passwordHash) {
    await dummyWork();
    return null;
  }
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) return null;
  return { id: user.id, email: user.email, name: user.name };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: authorizeCredentials,
    }),
  ],
});

export { CredentialsSignin };
