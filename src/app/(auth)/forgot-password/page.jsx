import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/AuthForms";

export const metadata = { title: "forgot password · ascendai" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="forgot password"
      heading="forgot your password?"
      intro="enter your email and we'll send a link to set a new one. if you had an account before, this is how you claim it."
      footer={<Link href="/sign-in" className="font-medium underline underline-offset-4">back to sign in</Link>}
    >
      <ForgotForm />
    </AuthShell>
  );
}
