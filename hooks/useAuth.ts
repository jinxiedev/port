"use client"

import { useState, useEffect } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass)
      return { user: cred.user, error: null }
    } catch (err: any) {
      return { user: null, error: err.message || "Failed to sign in" }
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      return { error: null }
    } catch (err: any) {
      return { error: err.message || "Failed to sign out" }
    }
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}
