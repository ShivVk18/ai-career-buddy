'use client'

import Header from "@/components/Header";

import CTASection from "@/components/landingPage/CTASection";
import FAQSection from "@/components/landingPage/FAQSection";
import FeatureSection from "@/components/landingPage/FeatureSection";
import Footer from "@/components/landingPage/Footer";
import HeroSection from "@/components/landingPage/HeroSection";

import React from "react";


export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-goldyBg text-white overflow-hidden">
      <Header />
      <HeroSection />
      <FeatureSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}