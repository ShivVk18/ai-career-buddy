'use client'

import { motion } from 'framer-motion'

export const AnimatedSection = ({ 
  children, 
  className = '',
  delay = 0,
  direction = 'up',
  stagger = false
}) => {
  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { y: 0, x: 60 },
    right: { y: 0, x: -60 }
  }

  const variants = {
    hidden: { 
      opacity: 0,
      ...directions[direction],
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        delay,
        ease: [0.25, 0.25, 0.25, 0.75],
        when: stagger ? "beforeChildren" : undefined,
        staggerChildren: stagger ? 0.1 : undefined
      }
    }
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedCard = ({ 
  children, 
  className = '',
  delay = 0,
  hover = true
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.25, 0.25, 0.25, 0.75]
        }
      }}
      whileHover={hover ? {
        y: -8,
        scale: 1.02,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.4)",
        transition: {
          duration: 0.3,
          ease: [0.25, 0.25, 0.25, 0.75]
        }
      } : {}}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}

export const AnimatedText = ({ 
  children, 
  className = '',
  delay = 0
}) => {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.8,
          delay,
          ease: [0.25, 0.25, 0.25, 0.75]
        }
      }}
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  )
}

export const FloatingElement = ({ 
  children, 
  className = '',
  amplitude = 10,
  duration = 4
}) => {
  return (
    <motion.div
      className={className}
      animate={{ 
        y: [0, -amplitude, 0],
        transition: {
          duration,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      {children}
    </motion.div>
  )
}
