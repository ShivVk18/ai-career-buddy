import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED = [
  "/dashboard",
  "/resume",
  "/resume-parser",
  "/interview",
  "/cover-letter",
  "/cold-email",
  "/roadmap",
  "/tools",
  "/onboarding",
  "/chat",
  "/jobs",
  "/applications",
  "/needs-you",
  "/review",
  "/offers",
  "/settings",
  "/api/chat",
];
const isProtected = (path) => PROTECTED.some((p) => path === p || path.startsWith(p + "/"));

export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  if (req.auth?.user?.id || !isProtected(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL("/sign-in", req.nextUrl.origin);
  url.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(url);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
