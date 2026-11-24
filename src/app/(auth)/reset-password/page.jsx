import AuthShell from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/AuthForms";

export const metadata = { title: "set a new password · ascendai", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }) {
  const sp = await searchParams;
  const token = Array.isArray(sp?.token) ? sp.token[0] : sp?.token;
  return (
    <AuthShell title="new password" heading="set a new password." intro="confirm your email and choose a password. then you're in.">
      <ResetForm token={typeof token === "string" ? token : ""} />
    </AuthShell>
  );
}
