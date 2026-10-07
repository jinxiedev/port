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
          <div className="relative size-full p-6 flex flex-col justify-between bg-gradient-to-b from-[#14141d] to-[#0a0a0e] text-[#EDE8DF] overflow-hidden select-none">
            {/* Corner Blueprint Crosshairs */}
            <span className="absolute top-2.5 left-2.5 font-mono text-[9px] text-[#D97757]/60 select-none">
              +
            </span>
            <span className="absolute top-2.5 right-2.5 font-mono text-[9px] text-[#D97757]/60 select-none">
              +
            </span>
            <span className="absolute bottom-2.5 left-2.5 font-mono text-[9px] text-[#D97757]/60 select-none">
              +
            </span>
            <span className="absolute bottom-2.5 right-2.5 font-mono text-[9px] text-[#D97757]/60 select-none">
              +
            </span>

            {/* Subtle Blueprint Grid Pattern Watermark */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Header: Index, Status & Domain */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#D97757] font-bold text-[11px] tracking-wider">
                    SPEC {indexStr}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="text-white/40 text-[10px] tracking-widest">
                    {totalStr}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ONLINE</span>
                </div>
              </div>

              <div className="text-[10px] tracking-[0.2em] text-[#D97757] uppercase font-mono truncate">
                // {project.domain || "DISTRIBUTED SYSTEM"}
              </div>

              {/* Title & Description */}
              <h4 className="font-serif text-2xl text-[#EDE8DF] font-medium leading-snug line-clamp-2">
                {project.title}
              </h4>

              <p className="text-xs text-white/60 font-light leading-relaxed line-clamp-3">
                {project.description}
              </p>
            </div>

            {/* Lower: Telemetry Metrics & Action */}
            <div className="relative z-10 space-y-4 pt-2">
              {/* Telemetry Metric Readout */}
              <div className="py-2.5 px-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
                <div>
                  <div className="font-mono text-xl font-light text-[#D97757] tracking-tight">
                    {project.metric || "ACTIVE"}
                  </div>
                  <span className="block text-[9px] font-mono uppercase tracking-widest text-white/40">
                    {project.metricLabel || "Production Deployment"}
                  </span>
                </div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/90 px-2 py-0.5 rounded border border-emerald-400/20 bg-emerald-400/5">
                  VERIFIED
                </span>
              </div>

              {/* Tech Stack Pills & Launch Link */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.06]">
                <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.08] text-white/60"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="text-[8px] font-mono text-white/30">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>

                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-mono tracking-widest uppercase text-[#D97757] hover:text-white transition-colors shrink-0 group/link"
                >
                  <span>Launch</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
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
          cardWidth={380}
          cardHeight={390}
          containerHeight={450}
          spacing={280}
          depth={170}
          rotation={35}
          scaleStep={0.14}
          autoplay={false}
          className="w-full"
        />
      </div>
    </div>
  )
}

export default ProjectMonograph
