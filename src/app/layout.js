import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/Theme-Provider";

export const metadata = {
  title: "AscendAI — AI Career Coach",
  description: "Your AI-powered career growth platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/logo.png" sizes="any" />
          <link
            href="https://api.fontshare.com/v2/css?f[]=clash-grotesk@200,300,400,500,600,700&f[]=general-sans@200,300,400,500,600,700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="font-general antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            <main className="min-h-screen">{children}</main>
            <Toaster richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
