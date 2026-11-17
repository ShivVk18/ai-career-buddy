import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/Theme-Provider";

export const metadata = {
  title: "ascendai — ai career coach with pip",
  description: "your cozy ai career coach. meet pip: it highlights matches, strikes weak lines, and gets you hired as yourself.",
  icons: {
    icon: "/pip/pip-coffee.svg",
    apple: "/pip/pip-coffee.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&family=Pixelify+Sans:wght@400..700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="bg-bg text-text font-sans antialiased selection:bg-pip-soft selection:text-pip-ink min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange={false}
          >
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  border: "1px solid #ECEAE4",
                  color: "#23222B",
                  fontSize: "13px",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
                },
              }}
            />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
