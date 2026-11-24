// Tiny email interface. One function: sendEmail({ to, subject, text }).
// Providers: Resend (RESEND_API_KEY + EMAIL_FROM). Without a provider: development logs the message (including the
// link) to the server console; production refuses with a clear error and never logs tokens.

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured on the server (set RESEND_API_KEY and EMAIL_FROM).");
    this.name = "EmailNotConfiguredError";
  }
}

const isProd = () => process.env.NODE_ENV === "production";
const hasProvider = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/** True when an email can be sent or (outside production) logged. */
export const emailReady = () => hasProvider() || !isProd();

export async function sendEmail({ to, subject, text }) {
  if (hasProvider()) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
    });
    if (!res.ok) throw new Error(`Email provider responded ${res.status}`);
    return;
  }
  if (isProd()) throw new EmailNotConfiguredError();
  console.log(`[dev email] to=${to} subject="${subject}"\n${text}`);
}

/** Base URL for links in emails. Production needs AUTH_URL (never derived from request headers). */
export function appUrl() {
  const u = process.env.AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (u) return u.replace(/\/+$/, "");
  if (isProd()) throw new EmailNotConfiguredError();
  return "http://localhost:3000";
}

export async function sendPasswordResetEmail(to, token) {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to,
    subject: "Set or reset your AscendAI password",
    text: `Use this link to set your password. It works once and expires in 30 minutes.\n\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
  });
}
