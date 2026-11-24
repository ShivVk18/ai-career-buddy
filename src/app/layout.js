import "./globals.css";
import { Geist, Newsreader, Pixelify_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
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
        <body className="bg-bg text-text font-sans antialiased selection:bg-lime selection:text-lime-foreground min-h-screen">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster position="top-center" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
