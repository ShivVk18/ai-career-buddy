import { getIndustryInsights } from '@/actions/Dashboard';
import { getUserOnboardingStatus } from '@/actions/User';
import React from 'react'
import InsightsView from './_component/InsightsView';
import { redirect } from 'next/navigation';

const InsightsPage = async() => {
  const { isOnboarded } = await getUserOnboardingStatus();

  
  if (!isOnboarded) {
    redirect("/onboarding");
  }

  const insights = await getIndustryInsights();

  return (
    <div className="container mx-auto">
      <InsightsView insights={insights} />
    </div>
  );
}

export default InsightsPage