"use client"

import * as React from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthModal } from "@/components/admin/auth-modal"
import { AdminPanel } from "@/components/admin/admin-panel"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [authOpen, setAuthOpen] = React.useState(false)
  const [adminOpen, setAdminOpen] = React.useState(false)

  React.useEffect(() => {
    if (!loading) {
      if (user) {
        setAdminOpen(true)
        setAuthOpen(false)
      } else {
        setAuthOpen(true)
        setAdminOpen(false)
      }
    }
  }, [user, loading])

  const handleClose = () => {
    router.push("/")
  }

  const handleAuthSuccess = () => {
    setAuthOpen(false)
    setAdminOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#08080B] text-[#EDE8DF] flex items-center justify-center">
      <AuthModal
        isOpen={authOpen}
        onClose={handleClose}
        onSuccess={handleAuthSuccess}
      />
      <AdminPanel
        isOpen={adminOpen}
        onClose={handleClose}
      />
    </div>
  )
}
