"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"
import type { Project } from "@/lib/projects"
import CoverflowCarousel, { type CoverflowCarouselItem } from "@/components/ui/coverflow-carousel"

interface ProjectMonographProps {
  projects: Project[]
  className?: string
}

export function ProjectMonograph({ projects, className = "" }: ProjectMonographProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [carouselIndex, setCarouselIndex] = React.useState<number>(0)

  // Extract unique categories from domain
  const categories = React.useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => {
      const d = (p.domain || "").toUpperCase()
      if (d.includes("AI") || d.includes("INFERENCE") || d.includes("VISION")) set.add("AI & INFERENCE")
      else if (d.includes("STREAM") || d.includes("MEDIA")) set.add("STREAMING & MEDIA")
      else if (d.includes("SYSTEM") || d.includes("RUNTIME")) set.add("SYSTEMS & RUNTIME")
      else if (d.includes("STORAGE") || d.includes("CDN")) set.add("STORAGE & CDN")
      else set.add("WEB & CLOUD")
    })
    return ["ALL", ...Array.from(set)]
  }, [projects])

  const filteredProjects = React.useMemo(() => {
    if (selectedCategory === "ALL") return projects
    return projects.filter((p) => {
      const d = (p.domain || "").toUpperCase()
      if (selectedCategory === "AI & INFERENCE") return d.includes("AI") || d.includes("INFERENCE") || d.includes("VISION")
      if (selectedCategory === "STREAMING & MEDIA") return d.includes("STREAM") || d.includes("MEDIA")
      if (selectedCategory === "SYSTEMS & RUNTIME") return d.includes("SYSTEM") || d.includes("RUNTIME")
      if (selectedCategory === "STORAGE & CDN") return d.includes("STORAGE") || d.includes("CDN")
      return true
    })
  }, [projects, selectedCategory])

  // Convert filtered projects into Coverflow carousel items (without images)
  const items: CoverflowCarouselItem[] = React.useMemo(() => {
    return filteredProjects.map((project, idx) => {
      const indexStr = String(idx + 1).padStart(2, "0")
      const totalStr = String(filteredProjects.length).padStart(2, "0")

      return {
        id: project.id,
        content: (
          <div className="relative size-full p-7 sm:p-8 flex flex-col justify-between bg-gradient-to-b from-[#111118] via-[#0c0c11] to-[#07070a] text-[#EDE8DF] overflow-hidden select-none group">
            {/* Ambient Background Warmth */}
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#D97757]/[0.05] blur-3xl pointer-events-none" />

            {/* Faint Architectural Watermark Numeral */}
            <span className="absolute top-1 right-4 font-serif text-[110px] leading-none font-extralight text-white/[0.03] select-none pointer-events-none tracking-tighter">
              {indexStr}
            </span>

            {/* Top Bar: Minimal Editorial Meta */}
            <div className="relative z-10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D97757]" />
                <span className="text-[10px] font-mono tracking-[0.22em] text-[#D97757] uppercase font-medium">
                  {project.domain || "SYSTEM"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-white/30 tracking-widest">
                {indexStr} &mdash; {totalStr}
              </span>
            </div>

            {/* Middle: Editorial Title & Description */}
            <div className="relative z-10 space-y-3 my-auto">
              <h4 className="font-serif text-2xl sm:text-[25px] font-normal text-[#EDE8DF] tracking-tight leading-snug line-clamp-2">
                {project.title}
              </h4>
              <p className="text-[13px] text-white/55 font-light leading-relaxed line-clamp-3">
                {project.description}
              </p>
            </div>

            {/* Bottom: Minimalist Telemetry & Tech Details */}
            <div className="relative z-10 pt-4 border-t border-white/[0.06] space-y-3.5">
              {/* Telemetry Metric Readout */}
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-white/40 block">
                  {project.metricLabel || "CORE TELEMETRY"}
                </span>
                <span className="font-mono text-xl sm:text-2xl font-light text-[#EDE8DF] tracking-tight">
                  {project.metric || "ACTIVE"}
                </span>
              </div>

              {/* Minimalist Tech Stack & View Link */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/40 tracking-wider truncate max-w-[200px]">
                  {project.tags.slice(0, 3).map((tag, i) => (
                    <React.Fragment key={tag}>
                      {i > 0 && <span className="text-white/20">/</span>}
                      <span className="text-white/60">{tag}</span>
                    </React.Fragment>
                  ))}
                </div>

                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono tracking-widest uppercase text-[#D97757] hover:text-[#EDE8DF] transition-colors shrink-0 group/link"
                >
                  <span>View System</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </div>
            </div>
          </div>
        ),
      }
    })
  }, [filteredProjects])

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97757]" />
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#D97757]">
              02.1 // ARCHITECTURAL DOSSIER &amp; SYSTEM SPECIFICATIONS
            </p>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-[#EDE8DF]">
            System Specifications Monograph
          </h3>
          <p className="text-xs md:text-sm text-white/50 max-w-xl font-light leading-relaxed">
            Interactive 3D Coverflow of production architectures, low-level protocols, and runtime telemetry without duplicate imagery.
          </p>
        </div>

        {/* Live Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#0a0a0e] p-1 rounded-xl border border-white/[0.08] self-start md:self-end">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setCarouselIndex(0)
                }}
                className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#D97757]/15 text-[#EDE8DF] border border-[#D97757]/40 shadow-sm"
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                {cat}
                {cat === "ALL" && (
                  <span className="ml-1.5 opacity-60">[{projects.length}]</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* 3D Coverflow Carousel (Zero Images, Pure Architectural Dossier Content) */}
      <div className="w-full overflow-hidden">
        <CoverflowCarousel
          items={items}
          index={carouselIndex}
          onIndexChange={setCarouselIndex}
          loop={true}
          cardWidth={370}
          cardHeight={390}
          containerHeight={440}
          spacing={260}
          depth={160}
          rotation={32}
          scaleStep={0.14}
          autoplay={false}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default ProjectMonograph
