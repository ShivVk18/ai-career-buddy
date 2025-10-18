import React from 'react'
import { BentoGridAISection } from '../FeatureSections'
import { AnimatedSection, AnimatedText } from '../AnimatedSection'

const FeatureSection = () => {
  return (
   <section className="py-32 px-6 lg:px-8 relative bg-gradient-to-b from-[#1a0c05] via-[#2a1608] to-[#1a0c05]">
     {/* Subtle gradient overlay */}
     <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,94,0,0.08),transparent_50%)]" />
     <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(255,140,66,0.06),transparent_50%)]" />
     
     <div className="max-w-7xl mx-auto relative z-10">
       <AnimatedSection className="text-center mb-20">
         <AnimatedText>
           <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#fff4ed] tracking-tight">
             Powerful Features
           </h2>
         </AnimatedText>
         <AnimatedText delay={0.2}>
           <p className="text-xl md:text-2xl text-[#c4a893] max-w-3xl mx-auto font-light leading-relaxed">
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