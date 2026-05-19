// FeatureSection.jsx
'use client'

import React from 'react'
import { BentoGridAISection } from '../FeatureSections'
import { motion } from 'framer-motion'

const FeatureSection = () => {
  return (
    <section id="features" className="py-32 px-6 md:px-12 relative bg-background overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-divider opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="md:col-span-8"
          >
            <h2 className="text-4xl md:text-6xl font-clash font-bold mb-8 text-foreground uppercase tracking-tight">
              Everything you need to get hired
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed max-w-3xl">
              Six powerful AI tools built to help you stand out at every stage
              of your job search — from your first resume draft to your final
              interview round.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <BentoGridAISection />
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-divider opacity-30" />
    </section>
  )
}

export default FeatureSection