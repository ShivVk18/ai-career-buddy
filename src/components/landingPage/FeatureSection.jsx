import React from 'react'
import { BentoGridAISection } from '../FeatureSections'
import { AnimatedSection, AnimatedText } from '../AnimatedSection'

const FeatureSection = () => {
  return (
   <section className="py-32 px-6 lg:px-8 relative z-10">
           <div className="max-w-7xl mx-auto">
             <AnimatedSection className="text-center mb-24">
               <AnimatedText>
                 <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-white tracking-tight">
                   Powerful Features
                 </h2>
               </AnimatedText>
               <AnimatedText delay={0.2}>
                 <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
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