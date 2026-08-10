import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/Theme-Provider";

export const metadata = {
  title: "AscendAI — AI Career Coach",
  description: "Your AI-powered career growth platform. Land your dream job with AI-driven resume analysis, interview coaching, and career roadmaps.",

  openGraph: {
    title: "AscendAI — AI Career Coach",
    description: "Your AI-powered career growth platform.",
    url: "https://ascendai.app",
    siteName: "AscendAI",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "AscendAI Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "AscendAI — AI Career Coach",
    description: "Your AI-powered career growth platform.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <head>
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
