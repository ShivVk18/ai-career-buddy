import "./globals.css";
import { Geist, Newsreader, Pixelify_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/Theme-Provider";

const geist = Geist({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], display: "swap", variable: "--nf-sans" });
const newsreader = Newsreader({ subsets: ["latin"], weight: "variable", style: ["normal", "italic"], axes: ["opsz"], display: "swap", variable: "--nf-doc" });
const pixelify = Pixelify_Sans({ subsets: ["latin"], weight: "variable", display: "swap", variable: "--nf-pixel" });

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
      <html lang="en" suppressHydrationWarning className={`${geist.variable} ${newsreader.variable} ${pixelify.variable}`}>
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
