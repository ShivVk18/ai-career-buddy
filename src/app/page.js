'use client'

import Header from "@/components/Header";
import CTASection from "@/components/landingPage/CTASection";
import FeatureSection from "@/components/landingPage/FeatureSection";
import Footer from "@/components/landingPage/Footer";
import PricingSection from "@/components/landingPage/PricingSection";
import HeroSection from "@/components/landingPage/HeroSection";
import EditorialContentGrid from "@/components/landingPage/EditorialContentGrid";


import React from "react";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden selection:bg-accent selection:text-background">
 
      <div className="noise-overlay" />
      
     
      <div className="absolute inset-0 bg-grid pointer-events-none opacity-20" />
      <Header />
      
      <main>
        <HeroSection />
        
       
        <div className="w-full h-[1px] bg-divider opacity-50"></div>
        
        <EditorialContentGrid />
        <FeatureSection />
        <PricingSection />
        <CTASection />
      </main>

      <Footer />

      

    </div>
  );
}