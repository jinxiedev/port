"use client"

import * as React from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

export interface ImmersivePreloaderProps {
  onComplete?: () => void
  className?: string
}

/**
 * Pure Gaussian Blur-In & Blur-Out Preloader
 * 
 * Choreography:
 * 1. Intro (0 - 1000ms): Typography glides in from a heavy 48px Gaussian blur to pin-sharp 0px.
 * 2. Presence (1000 - 1650ms): Calm, pristine focus allowing the eye to comfortably read "jinshi".
 * 3. Exit Reveal (1650 - 3050ms): A pronounced 1.4s Gaussian blur bloom (0px -> 64px) with subtle scale expansion (1.0 -> 1.14),
 *    visibly melting into a creamy optical haze before dissolving into the 3D crystal hero.
 */
export function ImmersivePreloader({
  onComplete,
  className,
}: ImmersivePreloaderProps) {
  // Phase: 0: initial -> 1: blur in -> 2: blur out / exit reveal -> 3: complete
  const [phase, setPhase] = React.useState<0 | 1 | 2 | 3>(0)

  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    // Choreographed timeline for clearly noticeable, luxurious blur
    const t1 = setTimeout(() => setPhase(1), 60)    // Start blur in
    const t2 = setTimeout(() => setPhase(2), 1650)  // Start pronounced blur out / exit reveal (after 600ms+ sharp presence)
    const t3 = setTimeout(() => {
      setPhase(3)
      document.body.style.overflow = ""
      onComplete?.()
    }, 3050) // Complete & unmount after 1.4s exit blur

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      document.body.style.overflow = originalOverflow
    }
  }, [onComplete])

  if (phase === 3) return null

  const isExiting = phase === 2

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto select-none bg-[#08080B] overflow-hidden",
        className
      )}
      initial={{ opacity: 1 }}
      animate={isExiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{
        duration: 1.35,
        delay: 0.1, // Allow blur to visibly initiate before background completely fades
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      {/* Centered Typography with Pronounced Gaussian Blur */}
      <motion.div
        className="flex flex-col items-center justify-center text-center px-6"
        initial={{
          filter: "blur(48px)",
          opacity: 0,
          scale: 0.92,
          letterSpacing: "0.18em",
        }}
        animate={
          phase >= 1
            ? isExiting
              ? {
                  filter: "blur(64px)",     // Deep, rich Gaussian blur
                  opacity: [1, 0.85, 0.3, 0], // Stays visible while blurring!
                  scale: 1.14,              // Luxurious optical expansion
                  letterSpacing: "0.22em",  // Gentle defocus stretch
                }
              : {
                  filter: "blur(0px)",
                  opacity: 1,
                  scale: 1,
                  letterSpacing: "0.02em",
                }
            : {
                filter: "blur(48px)",
                opacity: 0,
                scale: 0.92,
                letterSpacing: "0.18em",
              }
        }
        transition={{
          duration: isExiting ? 1.4 : 1.0,
          ease: isExiting ? [0.22, 1, 0.36, 1] : [0.16, 1, 0.3, 1],
        }}
      >
        {/* Subtle Eyebrow */}
        <motion.p
          className="font-mono text-xs uppercase tracking-[0.3em] text-[#D97757] mb-4 select-none"
          initial={{ opacity: 0, filter: "blur(16px)" }}
          animate={
            phase >= 1 && !isExiting
              ? { opacity: 0.85, filter: "blur(0px)" }
              : { opacity: 0, filter: "blur(32px)" }
          }
          transition={{
            duration: isExiting ? 1.1 : 0.85,
            delay: isExiting ? 0 : 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          Fullstack Software Engineer
        </motion.p>

        {/* Master Serif "jinshi" Headline */}
        <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif text-[#EDE8DF] tracking-normal leading-none select-none">
          jinshi
        </h1>

        {/* Minimalist Sub-indicator */}
        <motion.div
          className="mt-8 flex items-center gap-2.5 font-mono text-[10px] tracking-[0.25em] text-white/30 uppercase select-none"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={
            phase >= 1 && !isExiting
              ? { opacity: 1, filter: "blur(0px)" }
              : { opacity: 0, filter: "blur(24px)" }
          }
          transition={{
            duration: isExiting ? 0.9 : 0.6,
            delay: isExiting ? 0 : 0.25,
          }}
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D97757]/80" />
          <span>Available for Full-time &amp; Projects &bull; 2026</span>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default ImmersivePreloader
