"use client"

import * as React from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthModal } from "./auth-modal"
import { AdminPanel } from "./admin-panel"

export function AdminGate() {
  const { user } = useAuth()
  const [authModalOpen, setAuthModalOpen] = React.useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = React.useState(false)

  const openAdmin = React.useCallback(() => {
    if (user) {
      setAdminPanelOpen(true)
    } else {
      setAuthModalOpen(true)
    }
  }, [user])

  // 1. Keyboard shortcuts:
  //    - Ctrl + Shift + A or Cmd + Shift + A
  //    - Typing 'admin' sequence
  React.useEffect(() => {
    let keySequence = ""
    let sequenceTimer: NodeJS.Timeout

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return
      }

      // Check Ctrl/Cmd + Shift + A
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault()
        openAdmin()
        return
      }

      // Check sequence 'admin'
      const key = e.key.toLowerCase()
      if (/^[a-z]$/.test(key)) {
        keySequence += key
        clearTimeout(sequenceTimer)

        if (keySequence.endsWith("admin")) {
          keySequence = ""
          openAdmin()
        } else {
          sequenceTimer = setTimeout(() => {
            keySequence = ""
          }, 2500)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearTimeout(sequenceTimer)
    }
  }, [openAdmin])

  // 2. Secret URL query parameter: ?admin or ?admin=true
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      if (params.has("admin")) {
        openAdmin()
        // Clean URL query without reload
        const newUrl = window.location.pathname
        window.history.replaceState({}, "", newUrl)
      }
    }
  }, [openAdmin])

  // 3. Custom event listener: window.dispatchEvent(new CustomEvent("open-admin"))
  React.useEffect(() => {
    const handleCustomOpen = () => {
      openAdmin()
    }
    window.addEventListener("open-admin", handleCustomOpen)
    return () => window.removeEventListener("open-admin", handleCustomOpen)
  }, [openAdmin])

  const handleAuthSuccess = () => {
    setAuthModalOpen(false)
    setAdminPanelOpen(true)
  }

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => setAdminPanelOpen(false)}
      />
    </>
  )
}
