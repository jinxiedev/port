"use client"

import * as React from "react"
import { motion, useScroll, useTransform, useSpring } from "motion/react"
import { ArrowDown, Terminal } from "lucide-react"
import PrismHero from "@/components/ui/prism-hero"
import { ShaderCanvas } from "@/components/ui/phosphor-30"

export function PrismPhosphorTransition() {
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Track scroll across a focused 300vh track
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Smooth, weighted spring for cinematic inertia
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 75,
    damping: 24,
    restDelta: 0.001,
  })

  // Numeric state for Prism crystal rotation (0 to 1 during the initial hero phase)
  const [prismProgress, setPrismProgress] = React.useState(0)
  const [isHeroInteractive, setIsHeroInteractive] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = smoothProgress.on("change", (latest) => {
      // Map 0 -> 0.35 of total scroll to crystal rotation
      const mapped = Math.min(1, Math.max(0, latest / 0.32))
      setPrismProgress(mapped)
      setIsHeroInteractive(latest < 0.25)
    })
    return () => unsubscribe()
  }, [smoothProgress])

  // =========================================================================
  // CINEMATIC PORTAL TRANSITION CURVES
  // Concept: The crystal zooms towards camera and opens up like an optical lens;
  // Phosphor expands outward from the crystal's focal center as an organic aperture.
  // =========================================================================

  // 1. Crystal Hero: Zooms towards the camera (1.0 -> 3.2x) and dissolves seamlessly
  const crystalScale = useTransform(smoothProgress, [0.20, 0.58], [1.0, 2.8])
  const crystalOpacity = useTransform(smoothProgress, [0, 0.24, 0.52], [1.0, 1.0, 0.0])

  // 2. Phosphor Core Portal: Expanding circular aperture from the crystal center
  const portalClip = useTransform(
    smoothProgress,
    [0.18, 0.65],
    ["circle(0% at 50% 50%)", "circle(130% at 50% 50%)"]
  )
  const portalOpacity = useTransform(
    smoothProgress,
    [0.18, 0.35, 0.80, 1.0],
    [0.0, 1.0, 0.85, 0.35]
  )

  // 3. Single Focused Narrative Statement (Surfaces right in the optical center)
  const narrativeOpacity = useTransform(
    smoothProgress,
    [0.42, 0.56, 0.78, 0.90],
    [0.0, 1.0, 1.0, 0.0]
  )
  const narrativeScale = useTransform(
    smoothProgress,
    [0.42, 0.56, 0.88],
    [0.90, 1.0, 1.04]
  )
  const narrativeY = useTransform(
    smoothProgress,
    [0.42, 0.56, 0.88],
    [30, 0, -30]
  )

  return (
    <div ref={containerRef} className="relative w-full h-[320vh] bg-[#08080B]">
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden select-none">
        
        {/* ============================================================== */}
        {/* 1. THE PHOSPHOR CORE (Expanding circular lens portal)           */}
        {/* ============================================================== */}
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            clipPath: portalClip,
            opacity: portalOpacity,
          }}
        >
          {/* High-detail, smooth WebGL shader */}
          <ShaderCanvas />

          {/* Vignette ring that follows the aperture opening */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-transparent to-[#08080B]/70 pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_#08080B_95%)] pointer-events-none" />
        </motion.div>

        {/* ============================================================== */}
        {/* 2. THE PRISM CRYSTAL (Zooms in towards viewer like a lens)     */}
        {/* ============================================================== */}
        <motion.div
          className="absolute inset-0 z-20 origin-center"
          style={{
            scale: crystalScale,
            opacity: crystalOpacity,
            pointerEvents: isHeroInteractive ? "auto" : "none",
          }}
        >
          <PrismHero
            staticProgress={prismProgress}
            eyebrow="Field Notes & Systems"
            headline="Fullstack"
            description="Software engineer building web applications end-to-end. Focused on solid architecture, clean codebases, and systems that actually scale."
            meta={[
              "React / Next.js / TypeScript",
              "Go & PostgreSQL",
              "Scroll to enter",
            ]}
            accent="#D97757"
            background="transparent"
            foreground="#EDE8DF"
            action={
              <a
                href="#projects"
                className="inline-flex items-center justify-center rounded-md bg-[#D97757] px-5 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#c4684a]"
              >
                Selected Works
              </a>
            }
            secondaryAction={
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-[#EDE8DF] transition-colors hover:bg-white/5"
              >
                Get in Touch
              </a>
            }
          />
        </motion.div>

        {/* ============================================================== */}
        {/* 3. FOCUSED EDITORIAL NARRATIVE (Center optical focus)          */}
        {/* ============================================================== */}
        <motion.div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center text-center p-6 md:p-12 pointer-events-none"
          style={{
            opacity: narrativeOpacity,
            scale: narrativeScale,
            y: narrativeY,
          }}
        >
          <div className="max-w-2xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D97757]/30 bg-black/60 backdrop-blur-md text-[#D97757] text-xs font-mono">
              <Terminal className="w-3.5 h-3.5" />
              <span>THE ARCHITECTURAL CORE</span>
            </div>

            <h2 className="text-4xl md:text-6xl font-serif text-[#EDE8DF] tracking-tight leading-[1.12]">
              Engineering beyond the surface.
            </h2>

            <p className="text-base md:text-lg font-light text-white/80 max-w-xl mx-auto leading-relaxed">
              Di balik antarmuka presisi dan refraksi visual, ada pipeline data teruji,
              skema database yang tangguh, serta backend yang siap menangani konkurensi tinggi.
            </p>

            <div className="pt-2">
              <span className="inline-flex items-center gap-2 text-xs font-mono text-[#D97757]/90 uppercase tracking-widest">
                <span>Eksplorasi Proyek Nyata</span>
                <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
              </span>
            </div>
          </div>
        </motion.div>

        {/* Bottom Progress Tracker Rail */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 z-40">
          <motion.div
            className="h-full bg-[#D97757] origin-left"
            style={{ scaleX: smoothProgress }}
          />
        </div>
      </div>
    </div>
  )
}

export default PrismPhosphorTransition
