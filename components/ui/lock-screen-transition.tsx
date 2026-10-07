"use client"

import * as React from "react"
import { motion, useScroll, useTransform, useSpring } from "motion/react"
import { Lock, Unlock, ChevronDown, Terminal, Sparkles, Code2, ArrowRight } from "lucide-react"
import { ShaderCanvas } from "@/components/ui/phosphor-30"

interface LockScreenTransitionProps {
  children?: React.ReactNode
  name?: string
  role?: string
}

export function LockScreenTransition({
  children,
  name = "Engineer Portfolio",
  role = "Fullstack Software Engineer",
}: LockScreenTransitionProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Track scroll through 300vh of locked space
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  })

  // Phase 1: Lock Screen Dispersal (0 -> 0.35)
  const lockOpacity = useTransform(smoothProgress, [0, 0.25], [1, 0])
  const lockScale = useTransform(smoothProgress, [0, 0.3], [1, 0.9])
  const lockY = useTransform(smoothProgress, [0, 0.3], [0, -60])
  const lockBlur = useTransform(smoothProgress, [0, 0.25], ["blur(0px)", "blur(12px)"])

  // Phase 2: Shader Transition (0 -> 0.85)
  // Starts with an iris / circle mask or subtle glow and scales to full view
  const shaderScale = useTransform(smoothProgress, [0, 0.5, 0.8], [0.85, 1, 1.05])
  const shaderOpacity = useTransform(smoothProgress, [0, 0.2, 0.75, 1], [0.35, 0.85, 0.75, 0.15])
  const shaderFilter = useTransform(smoothProgress, [0.6, 1], ["brightness(1)", "brightness(0.3)"])

  // Phase 3: Unlocked Hero Content (0.25 -> 0.85)
  const unlockedOpacity = useTransform(smoothProgress, [0.22, 0.38, 0.75, 0.9], [0, 1, 1, 0])
  const unlockedScale = useTransform(smoothProgress, [0.22, 0.45], [0.92, 1])
  const unlockedY = useTransform(smoothProgress, [0.22, 0.5, 0.85], [40, 0, -40])

  // Current time for lock screen
  const [time, setTime] = React.useState("00:00")
  const [date, setDate] = React.useState("")
  const [isUnlocked, setIsUnlocked] = React.useState(false)

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      )
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      )
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Update lock state based on scroll
  React.useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      setIsUnlocked(latest > 0.12)
    })
    return () => unsubscribe()
  }, [smoothProgress])

  return (
    <div ref={containerRef} className="relative w-full h-[320vh] bg-[#050507]">
      {/* Sticky Viewport Frame ------------------------------------------- */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        
        {/* Background Shader: Phosphor-30 with scroll-driven dynamics */}
        <motion.div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            scale: shaderScale,
            opacity: shaderOpacity,
            filter: shaderFilter,
          }}
        >
          <ShaderCanvas />
          {/* Subtle noise / vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-[#050507]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#050507]/40 to-[#050507]" />
        </motion.div>

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 1: LOCK SCREEN (Visible at progress 0 -> 0.3)               */}
        {/* ----------------------------------------------------------------- */}
        <motion.div
          className="absolute inset-0 z-10 flex flex-col justify-between p-8 md:p-14"
          style={{
            opacity: lockOpacity,
            scale: lockScale,
            y: lockY,
            filter: lockBlur,
            pointerEvents: isUnlocked ? "none" : "auto",
          }}
        >
          {/* Top Status Bar */}
          <div className="flex items-center justify-between text-xs font-mono text-white/50 tracking-wider">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#D97757]" />
              <span>PORTFOLIO_SYSTEM_OS</span>
            </div>
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md">
              {isUnlocked ? (
                <Unlock className="w-3.5 h-3.5 text-[#D97757]" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-white/40" />
              )}
              <span className="text-[11px] uppercase text-white/70">
                {isUnlocked ? "Session Unlocked" : "Scroll to Unlock"}
              </span>
            </div>
          </div>

          {/* Center Clock & Identity */}
          <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
            <p className="text-sm md:text-base font-mono uppercase tracking-[0.25em] text-[#D97757]">
              {date || "System Terminal"}
            </p>
            <h1 className="text-7xl md:text-9xl font-serif font-extralight tracking-tight text-[#EDE8DF]">
              {time}
            </h1>
            <div className="pt-2 max-w-sm">
              <h2 className="text-xl md:text-2xl font-medium text-white/90">
                {name}
              </h2>
              <p className="text-xs md:text-sm font-mono text-white/40 mt-1">
                {role}
              </p>
            </div>
          </div>

          {/* Bottom Scroll Prompt */}
          <div className="flex flex-col items-center justify-center gap-2 text-white/40 text-xs font-mono">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <ChevronDown className="w-4 h-4 text-[#D97757]" />
            </motion.div>
            <span className="tracking-widest uppercase text-[10px]">
              Scroll down to reveal interface
            </span>
          </div>
        </motion.div>

        {/* ----------------------------------------------------------------- */}
        {/* LAYER 2: UNLOCKED INTERFACE (Visible at progress 0.25 -> 0.85)    */}
        {/* ----------------------------------------------------------------- */}
        <motion.div
          className="absolute inset-0 z-20 flex flex-col justify-between p-8 md:p-14 pointer-events-auto"
          style={{
            opacity: unlockedOpacity,
            scale: unlockedScale,
            y: unlockedY,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#D97757] animate-pulse" />
              <span className="text-xs font-mono tracking-widest text-[#D97757] uppercase">
                Active System / 2026
              </span>
            </div>
            <div className="text-xs font-mono text-white/40 hidden sm:block">
              Latency: &lt;14ms · Stack: Fullstack
            </div>
          </div>

          {/* Main Unlocked Presentation */}
          <div className="max-w-2xl my-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#D97757]/10 border border-[#D97757]/30 text-[#D97757] text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fullstack Architecture & Systems</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif leading-[1.1] text-[#EDE8DF]">
              Crafting solid code, not just pretty pixels.
            </h2>

            <p className="text-base md:text-lg text-white/70 font-light leading-relaxed">
              Membangun aplikasi web end-to-end dari database schema, resilient
              backend API, hingga antarmuka performa tinggi tanpa bloatware.
            </p>

            <div className="flex items-center gap-4 pt-4 flex-wrap">
              <a
                href="#projects"
                className="inline-flex items-center gap-2 rounded-md bg-[#D97757] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#c4684a]"
              >
                <span>Lihat Proyek</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-[#EDE8DF] transition-colors hover:bg-white/5"
              >
                Get in Touch
              </a>
            </div>
          </div>

          {/* Bottom Metas */}
          <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-mono text-white/40">
            <div className="flex items-center gap-4">
              <span>Go / Node / Next.js</span>
              <span>·</span>
              <span>PostgreSQL & Redis</span>
            </div>
            <span className="hidden sm:inline">Continue scrolling for case studies ↓</span>
          </div>
        </motion.div>

        {/* Scroll Progress Indicator Rail */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-30">
          <motion.div
            className="h-full bg-[#D97757] origin-left"
            style={{ scaleX: smoothProgress }}
          />
        </div>
      </div>

      {/* Children or next section that follows the transition */}
      {children && <div className="relative z-30">{children}</div>}
    </div>
  )
}

export default LockScreenTransition
