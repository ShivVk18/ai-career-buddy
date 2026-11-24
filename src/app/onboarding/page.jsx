import { redirect } from "next/navigation";
import OnboardingFlow from "./_components/OnboardingFlow";
import { getUserOnboardingStatus } from "@/actions/User";

export default async function OnboardingPage({ searchParams }) {
  const { edit } = (await searchParams) || {};
  // Onboarded users are sent home, except when they come here on purpose to add to their profile.
  if (!edit) {
    const { isOnboarded } = await getUserOnboardingStatus();
    if (isOnboarded) redirect("/dashboard");
  }

  return (
    <main>
      <OnboardingFlow editing={!!edit} />
    </main>
  );
}
