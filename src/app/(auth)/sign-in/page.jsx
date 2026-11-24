import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { SignInForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/components/auth/safeNext";
import { auth } from "@/lib/session";

export const metadata = { title: "sign in · ascendai" };

export default async function SignInPage({ searchParams }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp?.callbackUrl) ? sp.callbackUrl[0] : sp?.callbackUrl;
  const next = safeNext(raw);
  const { userId } = await auth();
  if (userId) redirect(next || "/dashboard");
  const qs = next ? `?callbackUrl=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell
      title="sign in"
      heading="welcome back."
      intro="sign in to pick up where you left off."
      footer={<>new here? <Link href={`/sign-up${qs}`} className="font-medium underline underline-offset-4">create an account</Link></>}
    >
      <SignInForm next={next} />
    </AuthShell>
  );
}
