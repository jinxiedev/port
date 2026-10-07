"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  LogOut,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { ProjectEditorModal } from "./project-editor-modal"
import type { ProjectDoc, ProjectInput } from "@/lib/firebase"

interface AdminPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { user, signOut } = useAuth()
  const { projects, loading, addProject, updateProject, deleteProject } = useProjects()

  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<ProjectDoc | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [toastMessage, setToastMessage] = React.useState<{ text: string; type: "success" | "error" } | null>(null)

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 3500)
  }

  const handleCreateClick = () => {
    setEditingProject(null)
    setEditorOpen(true)
  }

  const handleEditClick = (project: ProjectDoc) => {
    setEditingProject(project)
    setEditorOpen(true)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    const res = await deleteProject(id)
    setDeletingId(null)

    if (res.error) {
      showToast(res.error, "error")
    } else {
      showToast(`Deleted "${title}" successfully`)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("projects-updated"))
      }
    }
  }

  const handleSaveProject = async (input: ProjectInput) => {
    if (editingProject) {
      const res = await updateProject(editingProject.id, input)
      if (res.error) {
        showToast(res.error, "error")
        return { error: res.error }
      }
      showToast("Project updated successfully")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("projects-updated"))
      }
      return { error: null }
    } else {
      const res = await addProject(input)
      if (res.error) {
        showToast(res.error, "error")
        return { error: res.error }
      }
      showToast("Project added successfully")
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("projects-updated"))
      }
      return { error: null }
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const filteredProjects = projects.filter((p) => {
    const q = searchQuery.toLowerCase()
    return (
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    )
  })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[990] bg-[#08080B] text-[#EDE8DF] overflow-y-auto font-sans">
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[1100] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl font-mono text-xs border ${
              toastMessage.type === "success"
                ? "bg-[#0c1a12] border-emerald-500/30 text-emerald-300"
                : "bg-[#1c0e0e] border-red-500/30 text-red-300"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#08080B]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Site</span>
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-[#D97757]" />
              <h1 className="text-sm font-mono tracking-wider uppercase text-white font-semibold">
                Admin Console
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#D97757]/15 text-[#D97757] border border-[#D97757]/30">
                Firestore
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user?.email && (
              <span className="hidden sm:inline-block text-xs font-mono text-white/40 px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5">
                {user.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleCreateClick}
              className="px-4 py-2 rounded-lg bg-[#D97757] hover:bg-[#c66848] text-white font-mono text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors shadow-lg shadow-[#D97757]/10"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Controls bar: Search & Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or tags..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-xs placeholder:text-white/25 focus:outline-none focus:border-[#D97757]"
            />
          </div>

          <div className="text-xs font-mono text-white/40">
            Showing {filteredProjects.length} of {projects.length} live project{projects.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-28 text-white/40 font-mono text-xs space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#D97757]" />
            <span>Connecting to Firestore database...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-28 border border-dashed border-white/10 rounded-2xl bg-white/[0.01] space-y-4">
            <p className="text-sm font-mono text-white/50">No projects found.</p>
            <button
              type="button"
              onClick={handleCreateClick}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono uppercase tracking-wider text-white transition-colors"
            >
              Create Your First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group rounded-2xl border border-white/10 bg-[#0C0C10] overflow-hidden flex flex-col justify-between hover:border-white/20 transition-colors"
              >
                <div>
                  {/* Thumbnail */}
                  <div className="relative h-44 w-full bg-black/40 overflow-hidden border-b border-white/10">
                    {project.image_url ? (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/20 font-mono text-xs">
                        No Preview Image
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C0C10] via-transparent to-transparent opacity-70" />
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-black/70 border border-white/10 text-[#D97757]">
                      {project.domain || "PROJECT"}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-3">
                    <h3 className="font-serif text-lg text-white group-hover:text-[#D97757] transition-colors leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-white/60 font-light line-clamp-3 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>

                    {/* Tags */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {project.tags.slice(0, 4).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[10px] font-mono text-white/50"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                  {project.project_url ? (
                    <a
                      href={project.project_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-white/40 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Visit</span>
                    </a>
                  ) : (
                    <span className="text-[11px] font-mono text-white/20">No URL</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleEditClick(project)}
                      className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === project.id}
                      onClick={() => handleDelete(project.id, project.title)}
                      className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete Project"
                    >
                      {deletingId === project.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit Project Modal */}
      <ProjectEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </div>
  )
}
