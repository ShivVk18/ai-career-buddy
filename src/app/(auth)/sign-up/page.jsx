import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import { SignUpForm } from "@/components/auth/AuthForms";
import { safeNext } from "@/components/auth/safeNext";
import { auth } from "@/lib/session";

export const metadata = { title: "create your account · ascendai" };

export default async function SignUpPage({ searchParams }) {
  const sp = await searchParams;
  const raw = Array.isArray(sp?.callbackUrl) ? sp.callbackUrl[0] : sp?.callbackUrl;
  const next = safeNext(raw);
  const { userId } = await auth();
  if (userId) redirect(next || "/dashboard");
  const qs = next ? `?callbackUrl=${encodeURIComponent(next)}` : "";
  return (
    <AuthShell
      title="create account"
      heading="let's get you started."
      intro="it takes a minute. pip will ask a couple of questions next."
      footer={<>already have an account? <Link href={`/sign-in${qs}`} className="font-medium underline underline-offset-4">sign in</Link></>}
    >
      <SignUpForm next={next} />
    </AuthShell>
  );
}
