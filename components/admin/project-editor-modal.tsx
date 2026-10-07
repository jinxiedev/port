"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Image as ImageIcon, Link as LinkIcon, Tag, Sparkles, Loader2, AlertCircle } from "lucide-react"
import type { ProjectDoc, ProjectInput } from "@/lib/firebase"

interface ProjectEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: ProjectInput) => Promise<{ error: string | null }>
  initialData?: ProjectDoc | null
}

export function ProjectEditorModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectEditorModalProps) {
  const isEditing = Boolean(initialData)

  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [imageUrl, setImageUrl] = React.useState("")
  const [projectUrl, setProjectUrl] = React.useState("")
  const [tags, setTags] = React.useState("")
  const [domain, setDomain] = React.useState("")
  const [metric, setMetric] = React.useState("")
  const [metricLabel, setMetricLabel] = React.useState("")

  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "")
        setDescription(initialData.description || "")
        setImageUrl(initialData.image_url || "")
        setProjectUrl(initialData.project_url || "")
        setTags((initialData.tags || []).join(", "))
        setDomain(initialData.domain || "")
        setMetric(initialData.metric || "")
        setMetricLabel(initialData.metricLabel || "")
      } else {
        setTitle("")
        setDescription("")
        setImageUrl("")
        setProjectUrl("")
        setTags("")
        setDomain("")
        setMetric("")
        setMetricLabel("")
      }
      setError(null)
    }
  }, [isOpen, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError("Project title is required.")
      return
    }

    setSubmitting(true)
    setError(null)

    const tagsArray = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)

    const inputData: ProjectInput = {
      title: title.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      project_url: projectUrl.trim(),
      tags: tagsArray,
      domain: domain.trim() || undefined,
      metric: metric.trim() || undefined,
      metricLabel: metricLabel.trim() || undefined,
    }

    const res = await onSave(inputData)
    setSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-[#0C0C10] border border-white/10 rounded-2xl p-7 shadow-2xl z-10 max-h-[90vh] overflow-y-auto space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D97757]">
                  {isEditing ? "DATABASE RECORD" : "NEW RECORD"}
                </span>
                <h2 className="text-xl font-serif text-white mt-1">
                  {isEditing ? "Edit Project" : "Add New Project"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">
                  Project Title <span className="text-[#D97757]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JinsVision AI Lab"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Concise overview of architecture, pipeline, or core technical problem solved..."
                  className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors resize-none"
                />
              </div>

              {/* Image URL & Preview */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">
                  Cover Image URL
                </label>
                <div className="relative">
                  <ImageIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/project-cover.webp"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                  />
                </div>
                {imageUrl && (
                  <div className="mt-2 w-full h-32 rounded-lg overflow-hidden border border-white/10 bg-black/40 relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Project URL */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">
                  Live Project URL / Repository
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="url"
                    value={projectUrl}
                    onChange={(e) => setProjectUrl(e.target.value)}
                    placeholder="https://project.example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">
                  Tags (comma separated)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Go, PostgreSQL, React, Next.js, Redis"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                  />
                </div>
              </div>

              {/* Domain & Metric (Optional architectural callouts) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-white/50">
                    Domain / Category
                  </label>
                  <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="SYSTEMS & DATA"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs placeholder:text-white/20 focus:outline-none focus:border-[#D97757]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-white/50">
                    Hero Metric
                  </label>
                  <input
                    type="text"
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    placeholder="<150ms TTFB"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs placeholder:text-white/20 focus:outline-none focus:border-[#D97757]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-mono text-white/50">
                    Metric Subtitle
                  </label>
                  <input
                    type="text"
                    value={metricLabel}
                    onChange={(e) => setMetricLabel(e.target.value)}
                    placeholder="Edge Caching Pipeline"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs placeholder:text-white/20 focus:outline-none focus:border-[#D97757]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-lg bg-[#D97757] hover:bg-[#c66848] text-white font-mono text-xs uppercase tracking-wider font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D97757]/10"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{isEditing ? "Update Project" : "Create Project"}</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
