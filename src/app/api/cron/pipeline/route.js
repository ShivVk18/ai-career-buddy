import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { resumeStalledAll } from "@/lib/jobs/runner";
import { safeErr } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Protected by CRON_SECRET (Vercel Cron sends it as "Authorization: Bearer <CRON_SECRET>"). No Clerk session.
function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false; // not configured: closed
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(got);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function handle(req) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const advanced = await resumeStalledAll({ limit: 10 });
    return NextResponse.json({ ok: true, advanced });
  } catch (e) {
    console.error("cron pipeline failed:", safeErr(e));
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
