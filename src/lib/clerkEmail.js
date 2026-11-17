/** Clerk primary email, or null. Never returns a placeholder or empty string. */
export function primaryEmail(clerkUser) {
  const list = clerkUser?.emailAddresses || [];
  const primary = list.find((e) => e.id === clerkUser?.primaryEmailAddressId) || list[0];
  const v = primary?.emailAddress;
  return typeof v === "string" && v.trim() ? v.trim() : null;
}
