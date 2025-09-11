'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { GradientText } from './GradientText'
import { FloatingElement } from './AnimatedSection'

const ModernHeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      </div>

      {/* Floating elements */}
      <FloatingElement amplitude={30} duration={8} className="absolute top-1/4 left-1/4">
        <div className="w-6 h-6 bg-blue-500/20 rounded-full blur-xl"></div>
      </FloatingElement>
      <FloatingElement amplitude={25} duration={6} className="absolute top-1/3 right-1/4">
        <div className="w-8 h-8 bg-purple-500/20 rounded-full blur-xl"></div>
      </FloatingElement>
      <FloatingElement amplitude={20} duration={10} className="absolute bottom-1/4 left-1/2">
        <div className="w-4 h-4 bg-pink-500/20 rounded-full blur-xl"></div>
      </FloatingElement>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            duration: 1.2, 
            ease: [0.25, 0.25, 0.25, 0.75],
            delay: 0.2 
          }}
          className="mb-6"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Sparkles className="h-12 w-12 text-yellow-400 mx-auto" />
          </motion.div>
        </motion.div>

        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 1, 
            ease: [0.25, 0.25, 0.25, 0.75],
            delay: 0.4 
          }}
        >
          Transform Your Career{' '}
          <br />
          <GradientText>Journey Today</GradientText>
        </motion.h1>

        <motion.p
          className="text-lg sm:text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.25, 0.25, 0.75],
            delay: 0.6 
          }}
        >
          Discover your potential, map your path, and accelerate your professional growth with AI-powered career guidance
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.25, 0.25, 0.75],
            delay: 0.8 
          }}
        >
          <Link href="/assessment">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="lg"
                className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-2xl shadow-2xl group"
              >
                Start Your Journey
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="ml-2 h-5 w-5" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>

          <Link href="/demo">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-4 text-lg border-white/20 hover:bg-white/10 rounded-2xl backdrop-blur-sm"
              >
                Watch Demo
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        <motion.div
          className="mt-16 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.p
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Join thousands of professionals advancing their careers
          </motion.p>
        </motion.div>
      </div>
    </section>
  )
}

export default ModernHeroSection