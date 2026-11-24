import { redirect } from "next/navigation";
import { getUserOnboardingStatus } from "@/actions/User";

// Onboarding gate. /onboarding lives outside this route group, so it can't loop.
export default async function GatedLayout({ children }) {
  let isOnboarded = true;
  try {
    ({ isOnboarded } = await getUserOnboardingStatus());
  } catch (e) {
    // Signed-out users are handled by middleware; only treat that as pass-through.
    if (e?.message !== "Unauthorized") throw e;
  }
  if (!isOnboarded) redirect("/onboarding");
  return children;
}
