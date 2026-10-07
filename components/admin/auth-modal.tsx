"use client"

import * as React from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Lock, Mail, AlertCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const { signIn } = useAuth()

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      setError(null)
      // Check if email was saved previously in localStorage for convenience
      const savedEmail = typeof window !== "undefined" ? localStorage.getItem("admin_email") : null
      if (savedEmail) {
        setEmail(savedEmail)
      }
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please provide both email and password.")
      return
    }

    setSubmitting(true)
    setError(null)

    const res = await signIn(email, password)
    setSubmitting(false)

    if (res.error) {
      // Human-readable error message
      if (res.error.includes("auth/invalid-credential") || res.error.includes("auth/wrong-password")) {
        setError("Invalid email or password.")
      } else if (res.error.includes("auth/user-not-found")) {
        setError("Admin user account not found.")
      } else {
        setError(res.error)
      }
      return
    }

    // Save email for quick re-login
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_email", email)
    }

    setPassword("")
    onSuccess?.()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          {/* Backdrop dismiss */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-[#0C0C10] border border-white/10 rounded-2xl p-7 shadow-2xl z-10 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#D97757]">
                  SECURE PORTAL
                </span>
                <h2 className="text-xl font-serif text-white mt-1">Admin Access</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-mono"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    autoFocus
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-white/60">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/10 text-white font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-[#D97757] focus:ring-1 focus:ring-[#D97757]/40 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#D97757] hover:bg-[#c66848] text-white font-mono text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#D97757]/10"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to Admin</span>
                )}
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-[11px] font-mono text-white/30">
                Connected to Firestore (portofolio-jinshi)
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
