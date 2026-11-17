import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Safe error metadata for logs: never includes error.message (Prisma messages can echo query values).
export function safeErr(error) {
  return error?.code ?? error?.name ?? "unknown";
}
