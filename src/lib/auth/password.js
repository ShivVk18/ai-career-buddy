import bcrypt from "bcryptjs";

// bcrypt cost 12 (pure JS, no native build). bcrypt only reads the first 72 bytes, so passwords are capped at 72 chars.
const COST = 12;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export const hashPassword = (plain) => bcrypt.hash(plain, COST);

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

let dummy;
/** Burns the same CPU as a real hash/compare so unknown emails and known emails take similar time. */
export async function dummyWork() {
  dummy ??= bcrypt.hash("not-a-real-password-" + Math.random(), COST);
  await bcrypt.compare("x", await dummy);
}
