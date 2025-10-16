'use client'

import Header from "@/components/Header";
import BenefitSection from "@/components/landingPage/BenefitSection";
import CTASection from "@/components/landingPage/CTASection";
import FAQSection from "@/components/landingPage/FAQSection";
import FeatureSection from "@/components/landingPage/FeatureSection";
import Footer from "@/components/landingPage/Footer";
import HeroSection from "@/components/landingPage/HeroSection";
import HowItWorks from "@/components/landingPage/HowItWorks";
import React from "react";


export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      <Header />
      <HeroSection />
      <BenefitSection />
      <HowItWorks />
      <FeatureSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}