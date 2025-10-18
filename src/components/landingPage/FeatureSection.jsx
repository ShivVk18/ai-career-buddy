// FeatureSection.tsx
import React from 'react'
import { BentoGridAISection } from '../FeatureSections'
import { AnimatedSection, AnimatedText } from '../AnimatedSection'

const FeatureSection = () => {
  return (
   <section className="py-32 px-6 lg:px-8 relative bg-[#0f0e0a]">
     {/* Subtle gradient overlay */}
     <div className="absolute inset-0 overflow-hidden pointer-events-none">
       <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#f59e0b]/8 rounded-full blur-3xl" />
       <div className="absolute bottom-1/4 left-1/4 w-[32rem] h-[32rem] bg-[#fbbf24]/5 rounded-full blur-3xl" />
     </div>
      
       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/30 to-transparent" />
     <div className="max-w-7xl mx-auto relative z-10">
       <AnimatedSection className="text-center mb-20">
         <AnimatedText>
           <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
             Powerful Features
           </h2>
         </AnimatedText>
         <AnimatedText delay={0.2}>
           <p className="text-xl md:text-2xl text-[#b0b0b0] max-w-3xl mx-auto font-light leading-relaxed">
             Everything you need to navigate and accelerate your career development
           </p>
         </AnimatedText>
       </AnimatedSection>

       <AnimatedSection delay={0.2} stagger>
         <BentoGridAISection/>
       </AnimatedSection>
     </div>
   </section>
  )
}

export default FeatureSection