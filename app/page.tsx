"use client"
import * as React from "react"
import dynamic from "next/dynamic"
import { ArrowUpRight, Database, Layers, Code2 } from "lucide-react"
import { WorksWheel } from "@/components/ui/works-wheel"
import { InkOrbitFeatures } from "@/components/ui/ink-orbit-features"
import { CinematicFooter } from "@/components/ui/motion-footer"
import { ImmersivePreloader } from "@/components/ui/immersive-preloader"
import { AdminGate } from "@/components/admin/admin-gate"
import { FALLBACK_PROJECTS, getLiveProjects, type Project } from "@/lib/projects"

const PrismHero = dynamic(() => import("@/components/ui/prism-hero"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-[#08080B] text-[#EDE8DF]" />
  ),
})

import ContributionSkyline from "@/components/ui/contribution-skyline"

export default function Home() {
  const [preloaderActive, setPreloaderActive] = React.useState(true)
  const [projects, setProjects] = React.useState<Project[]>(FALLBACK_PROJECTS)
  const [contributions, setContributions] = React.useState<{ date: string; count: number }[] | undefined>(undefined)

  // Dynamically fetch live projects from Firestore with instant fallback
  const refreshProjects = React.useCallback(() => {
    getLiveProjects().then((data) => {
      if (data && data.length > 0) {
        setProjects(data)
      }
    })
  }, [])

  React.useEffect(() => {
    refreshProjects()

    // Listen for custom project update events from admin panel
    const handleProjectsUpdated = () => {
      refreshProjects()
    }
    window.addEventListener("projects-updated", handleProjectsUpdated)
    return () => window.removeEventListener("projects-updated", handleProjectsUpdated)
  }, [refreshProjects])

  // Fetch live GitHub contributions
  React.useEffect(() => {
    fetch("/api/contributions")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setContributions(data.data)
        }
      })
      .catch((err) => console.error("Error fetching GitHub contributions:", err))
  }, [])

  return (
    <main className="min-h-screen bg-[#08080B] text-[#EDE8DF] selection:bg-[#D97757]/30 selection:text-[#EDE8DF]">
      {/* Immersive Preloader with Pure Gaussian Blur-In */}
      {preloaderActive && (
        <ImmersivePreloader onComplete={() => setPreloaderActive(false)} />
      )}

      {/* 1. Pure Prism Hero (Zero Buttons, Pure Liquid & Typography) */}
      <PrismHero
        eyebrow="Fullstack Software Engineer"
        headline="jinshi"
        meta={[
          "Go & PostgreSQL",
          "React & Next.js / TypeScript",
          "Jakarta, ID (UTC+7)",
          "Available for Hire",
        ]}
        accent="#D97757"
        background="#08080B"
        foreground="#EDE8DF"
      />

      {/* 2. About / Profile Section - Pure Clean Minimalism */}
      <section id="about" className="relative z-30 max-w-5xl mx-auto px-6 py-28 border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center">
          {/* Photo Column (Pure 3:4 Ratio, Clean Frame) */}
          <div className="md:col-span-5 flex justify-center md:justify-start">
            <div className="relative w-full max-w-[320px] aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 bg-[#0c0c10] shadow-2xl">
              <img
                src="https://up.mo0n.qzz.io/yimmr5.jpg"
                alt="Jinshi"
                className="w-full h-full object-cover object-center"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Bio Column - Clean & Calm Understated English */}
          <div className="md:col-span-7 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#D97757]">
                01 / About
              </p>
              <h2 className="text-3xl md:text-5xl font-serif text-white leading-tight">
                Building durable, end-to-end web systems.
              </h2>
            </div>

            <p className="text-sm md:text-base text-white/60 font-light leading-relaxed max-w-xl">
              Fullstack engineer focused on end-to-end web architectures—from relational data modeling in PostgreSQL &amp; Go backend services, to responsive, zero-jank React/Next.js interfaces.
            </p>

            <div className="pt-2 text-xs font-mono text-white/40 space-y-1.5">
              <div>
                <span className="text-[#D97757]">Stack:</span> Go &bull; PostgreSQL &bull; TypeScript &bull; React &bull; Next.js &bull; Docker &bull; Redis
              </div>
              <div>
                <span className="text-white/60">Status:</span> Open for Full-Time &amp; Freelance &bull; Jakarta (UTC+7)
              </div>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs font-mono uppercase tracking-widest">
              <a
                href="mailto:contact@example.com"
                className="text-[#D97757] hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <span>Email Me</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href="#projects"
                className="text-white/40 hover:text-white transition-colors"
              >
                Selected Works &darr;
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Selected Projects Section (Dynamic Real Projects from Database) */}
      <section id="projects" className="relative z-30 py-24 space-y-12">
        <div className="max-w-5xl mx-auto px-6 space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D97757]">
            02 / Selected Works
          </p>
          <h2 className="text-3xl md:text-4xl font-serif">
            Systems &amp; Engineering
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Production projects focusing on distributed systems, real-time pipelines, and interface responsiveness.
          </p>
        </div>

        {/* 3D Interactive Works Wheel Showcase (Sticky Scroll, No BG, No Border) */}
        <WorksWheel
          items={projects.map((p) => ({
            title: p.title,
            image: p.image_url,
            href: p.project_url,
          }))}
          label="Works '26"
          action="Launch"
          sticky={true}
          className="w-full"
        />

        {/* Architecture & Engineering Telemetry Bento */}
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-6 pb-4">
          <InkOrbitFeatures
            theme="dark"
            brand="JINSHI CORE"
            tag="SYSTEM ARCHITECTURE"
            title="Distributed Systems *\nTelemetry & Architecture*"
          />
        </div>
      </section>

      {/* 4. Activity & Contribution Skyline */}
      <section id="activity" className="relative z-30 max-w-5xl mx-auto px-6 py-24 border-t border-white/10 space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D97757]">
            03 / Telemetry &amp; Shipping Activity
          </p>
          <h2 className="text-3xl md:text-4xl font-serif">
            Engineering Skyline
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Public open-source telemetry and verified patches rendered as an interactive 3D isometric skyline. Toggle between 2D heatmap and 3D architectural projection.
          </p>
          <p className="text-[11px] font-mono text-white/40">
            * Note: Core enterprise services and client production architectures are maintained in private repositories.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c0c10] p-2 md:p-4 overflow-hidden shadow-2xl">
          <ContributionSkyline
            data={contributions}
            defaultView="3d"
            palette="ember"
            unit="patch"
            unitPlural="patches"
            className="!border-white/10 !bg-[#0c0c10] !text-[#EDE8DF]"
          />
        </div>
      </section>

      {/* 5. Technical Principles (Understated & Factual) */}
      <section className="relative z-30 max-w-5xl mx-auto px-6 py-24 border-t border-white/10 space-y-12">
        <div className="space-y-3">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#D97757]">
            04 / Technical Principles
          </p>
          <h2 className="text-3xl md:text-4xl font-serif">
            How I Build Software
          </h2>
          <p className="text-sm md:text-base text-white/60 max-w-2xl font-light leading-relaxed">
            Three core pillars guiding every system: database reliability at the core, 60fps responsiveness on the client, and clean codebases for long-term maintainability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D97757]">
              <Database className="w-4 h-4" />
              <span>BACKEND &amp; DATA</span>
            </div>
            <h4 className="text-lg font-medium text-white">Reliable &amp; Predictable</h4>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Normalized relational schemas, ACID-compliant transactions, consistent REST APIs, and measured query profiling.
            </p>
            <div className="pt-2 text-xs font-mono text-white/40 space-y-1">
              <div>&bull; PostgreSQL, Go, Redis, Docker</div>
              <div>&bull; Query profiling &amp; cache strategy</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D97757]">
              <Layers className="w-4 h-4" />
              <span>FRONTEND &amp; INTERFACE</span>
            </div>
            <h4 className="text-lg font-medium text-white">Fast, Accessible &amp; Clean</h4>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Optimal Core Web Vitals (LCP &lt; 1.2s), keyboard-first navigation, zero layout shift, and smooth 60fps rendering across devices.
            </p>
            <div className="pt-2 text-xs font-mono text-white/40 space-y-1">
              <div>&bull; Next.js, React, TypeScript, Tailwind</div>
              <div>&bull; 60fps animations &amp; WebGL optimization</div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D97757]">
              <Code2 className="w-4 h-4" />
              <span>CODEBASE &amp; TEAM</span>
            </div>
            <h4 className="text-lg font-medium text-white">Maintainable &amp; Pragmatic</h4>
            <p className="text-sm text-white/60 font-light leading-relaxed">
              Modular architecture, clean git history, automated testing for critical paths, and honest, transparent communication.
            </p>
            <div className="pt-2 text-xs font-mono text-white/40 space-y-1">
              <div>&bull; Clean git commits &amp; code reviews</div>
              <div>&bull; Clear documentation for humans</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Cinematic Motion Footer (Curtain Reveal + Magnetic Pills) */}
      <CinematicFooter
        headline="Interested in working together?"
        giantText="ENGINEER"
        marqueeItems={[
          "Fullstack Software Engineer",
          "Go & PostgreSQL",
          "React & Next.js",
          "Reliable Architecture",
          "Available for Hire",
          "Jakarta, ID (UTC+7)",
        ]}
        email="contact@example.com"
        craftedBy="jinshi // Fullstack Engineer"
      />

      {/* Hidden Admin Portal (Triggered via Ctrl+Shift+A, typing 'admin', ?admin, or footer triple-click) */}
      <AdminGate />
    </main>
  )
}
