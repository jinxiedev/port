"use client"

import * as React from "react"
import { ArrowUpRight, Terminal, Layers, ExternalLink } from "lucide-react"
import type { Project } from "@/lib/projects"

interface ProjectMonographProps {
  projects: Project[]
  className?: string
}

export function ProjectMonograph({ projects, className = "" }: ProjectMonographProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL")
  const [showAll, setShowAll] = React.useState<boolean>(false)
  const [failedImages, setFailedImages] = React.useState<Record<string, boolean>>({})

  // Extract unique categories from domain or fallback categories
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

  const visibleProjects = showAll ? filteredProjects : filteredProjects.slice(0, 6)

  return (
    <div className={`space-y-12 ${className}`}>
      {/* Editorial Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97757]" />
            <p className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#D97757]">
              02.1 // ARCHITECTURAL DOSSIER &amp; SYSTEM SPECIFICATIONS
            </p>
          </div>
          <h3 className="font-serif text-2xl md:text-3xl text-[#EDE8DF]">
            Production Architectures &amp; Detailed Specs
          </h3>
          <p className="text-xs md:text-sm text-white/50 max-w-xl font-light leading-relaxed">
            Exhibition of production systems, runtime optimizations, low-level protocols, and distributed service topologies.
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
                  setShowAll(false)
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

      {/* Artsy Architectural Monograph Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {visibleProjects.map((project, idx) => {
          const indexStr = String(idx + 1).padStart(2, "0")
          const totalStr = String(filteredProjects.length).padStart(2, "0")
          const hasImageError = failedImages[project.id] || !project.image_url

          return (
            <article
              key={project.id}
              className="group relative rounded-2xl border border-white/[0.08] bg-[#0c0c12] p-6 md:p-8 flex flex-col justify-between space-y-6 transition-all duration-500 hover:border-[#D97757]/40 hover:bg-[#0e0e16] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Corner Blueprint Registration Marks */}
              <span className="absolute top-2.5 left-2.5 font-mono text-[9px] text-white/20 group-hover:text-[#D97757] transition-colors select-none pointer-events-none">
                +
              </span>
              <span className="absolute top-2.5 right-2.5 font-mono text-[9px] text-white/20 group-hover:text-[#D97757] transition-colors select-none pointer-events-none">
                +
              </span>
              <span className="absolute bottom-2.5 left-2.5 font-mono text-[9px] text-white/20 group-hover:text-[#D97757] transition-colors select-none pointer-events-none">
                +
              </span>
              <span className="absolute bottom-2.5 right-2.5 font-mono text-[9px] text-white/20 group-hover:text-[#D97757] transition-colors select-none pointer-events-none">
                +
              </span>

              {/* Upper Section: Visual Viewport & Domain Header */}
              <div className="space-y-5">
                {/* Dossier Meta Strip */}
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#D97757] text-[11px] font-bold tracking-wider">
                      SPEC {indexStr}
                    </span>
                    <span className="text-white/20">/</span>
                    <span className="text-white/40 text-[10px] tracking-widest">
                      {totalStr}
                    </span>
                  </div>

                  <span className="text-[10px] tracking-[0.2em] text-[#D97757] uppercase font-mono truncate max-w-[220px]">
                    // {project.domain || "DISTRIBUTED SYSTEM"}
                  </span>
                </div>

                {/* Artsy Project Image / Architectural Viewport */}
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/[0.08] bg-[#08080B] group-hover:border-white/20 transition-all">
                  {!hasImageError ? (
                    <img
                      src={project.image_url}
                      alt={project.title}
                      loading="lazy"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                      }}
                      className="size-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    /* Elegant Architectural Blueprint Fallback when image host is unavailable */
                    <div className="size-full flex flex-col items-center justify-center p-6 text-center relative bg-[#09090D] overflow-hidden select-none">
                      {/* Blueprint Grid Lines */}
                      <div
                        className="absolute inset-0 opacity-15"
                        style={{
                          backgroundImage:
                            "linear-gradient(rgba(217,119,87,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(217,119,87,0.3) 1px, transparent 1px)",
                          backgroundSize: "24px 24px",
                        }}
                      />
                      <div className="relative z-10 space-y-2">
                        <Terminal className="w-8 h-8 mx-auto text-[#D97757]/60 group-hover:text-[#D97757] transition-colors" />
                        <p className="font-serif text-lg text-white/80 font-medium tracking-wide">
                          {project.title}
                        </p>
                        <p className="text-[10px] font-mono tracking-widest text-[#D97757] uppercase">
                          // ARCHITECTURAL SCHEMATIC
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dark Vignette Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c12] via-transparent to-black/30 pointer-events-none" />

                  {/* Telemetry HUD Badges on Preview */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-mono text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ONLINE</span>
                  </div>

                  {project.metric && (
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-[#0c0c12]/85 backdrop-blur-md border border-[#D97757]/30 text-[10px] font-mono tracking-wider text-[#D97757]">
                      {project.metric}
                    </div>
                  )}
                </div>

                {/* Project Title & Engineering Synopsis */}
                <div className="space-y-2.5 pt-1">
                  <h4 className="font-serif text-2xl md:text-3xl text-[#EDE8DF] group-hover:text-white transition-colors leading-tight">
                    {project.title}
                  </h4>
                  <p className="text-xs md:text-sm text-white/60 font-light leading-relaxed line-clamp-3">
                    {project.description}
                  </p>
                </div>
              </div>

              {/* Lower Section: Telemetry Metric & Tags */}
              <div className="space-y-5 pt-3">
                {/* Hero Metric Callout */}
                <div className="py-3 px-4 rounded-xl border border-white/[0.06] bg-white/[0.015] flex items-center justify-between group-hover:border-[#D97757]/20 transition-colors">
                  <div>
                    <div className="font-mono text-xl md:text-2xl font-light text-white tracking-tight group-hover:text-[#D97757] transition-colors">
                      {project.metric || "VERIFIED"}
                    </div>
                    <span className="block text-[9px] md:text-[10px] font-mono uppercase tracking-widest text-white/40 mt-0.5">
                      {project.metricLabel || "Production Deployment"}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/90 px-2 py-0.5 rounded border border-emerald-400/20 bg-emerald-400/5">
                    Production
                  </span>
                </div>

                {/* Tech Stack Pills & Launch Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/[0.04]">
                  <div className="flex flex-wrap items-center gap-1.5 max-w-[280px]">
                    {project.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-white/60 group-hover:border-white/10 transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 4 && (
                      <span className="text-[9px] font-mono text-white/30">
                        +{project.tags.length - 4}
                      </span>
                    )}
                  </div>

                  <a
                    href={project.project_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono tracking-widest uppercase text-[#D97757] hover:text-white transition-colors group/btn shrink-0"
                  >
                    <span>Launch System</span>
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Expand / Collapse Archive Action */}
      {filteredProjects.length > 6 && (
        <div className="text-center pt-4">
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 bg-[#0c0c12] hover:bg-[#12121a] hover:border-[#D97757]/40 text-xs font-mono uppercase tracking-widest text-[#EDE8DF] hover:text-white transition-all cursor-pointer shadow-lg"
          >
            <span>
              {showAll
                ? `Collapse Archive [Showing ${filteredProjects.length}]`
                : `Expand Full Archive [${filteredProjects.length} Systems Total]`}
            </span>
            <span className="text-[#D97757]">{showAll ? "↑" : "↓"}</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default ProjectMonograph
