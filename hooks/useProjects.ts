"use client"

import { useState, useEffect, useCallback } from "react"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore"
import { db, auth, type ProjectDoc, type ProjectInput } from "@/lib/firebase"

export function useProjects() {
  const [projects, setProjects] = useState<ProjectDoc[]>([])
  const [loading, setLoading] = useState(true)

  const parseDoc = (docSnap: any): ProjectDoc => {
    const data = docSnap.data()
    return {
      id: docSnap.id,
      title: data.title || "Untitled Project",
      description: data.description || "",
      image_url: data.image_url || "",
      project_url: data.project_url || "#",
      tags: Array.isArray(data.tags) ? data.tags : [],
      created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at || new Date().toISOString(),
      updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at || new Date().toISOString(),
      user_id: data.user_id,
      domain: data.domain || "FULLSTACK APPLICATION",
      metric: data.metric || "ACTIVE",
      metricLabel: data.metricLabel || "Production Deployment",
    }
  }

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const projectsRef = collection(db, "projects")
      let q
      try {
        q = query(projectsRef, orderBy("created_at", "desc"))
      } catch {
        q = query(projectsRef)
      }
      const snapshot = await getDocs(q)
      const list: ProjectDoc[] = []
      snapshot.forEach((d) => {
        list.push(parseDoc(d))
      })
      setProjects(list)
    } catch (err) {
      console.error("Error fetching projects:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const projectsRef = collection(db, "projects")
    let q
    try {
      q = query(projectsRef, orderBy("created_at", "desc"))
    } catch {
      q = query(projectsRef)
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ProjectDoc[] = []
        snapshot.forEach((d) => {
          list.push(parseDoc(d))
        })
        setProjects(list)
        setLoading(false)
      },
      (err) => {
        console.warn("Realtime listener error, falling back to fetch:", err)
        fetchProjects()
      }
    )

    return () => unsubscribe()
  }, [fetchProjects])

  const addProject = async (input: ProjectInput) => {
    try {
      const user = auth.currentUser
      const docData: any = {
        title: input.title.trim(),
        description: input.description.trim(),
        image_url: input.image_url.trim(),
        project_url: input.project_url.trim(),
        tags: input.tags,
        domain: input.domain?.trim() || "FULLSTACK APPLICATION",
        metric: input.metric?.trim() || "ACTIVE",
        metricLabel: input.metricLabel?.trim() || "Production Deployment",
        user_id: user?.uid || "admin",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, "projects"), docData)
      const created: ProjectDoc = {
        id: docRef.id,
        ...docData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      setProjects((prev) => [created, ...prev.filter((p) => p.id !== docRef.id)])
      return { data: created, error: null }
    } catch (err: any) {
      return { data: null, error: err.message || "Failed to create project" }
    }
  }

  const updateProject = async (id: string, input: Partial<ProjectInput>) => {
    try {
      const projectRef = doc(db, "projects", id)
      const updateData: any = {
        ...input,
        updated_at: serverTimestamp(),
      }
      await updateDoc(projectRef, updateData)

      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, ...input, updated_at: new Date().toISOString() }
            : p
        )
      )
      return { error: null }
    } catch (err: any) {
      return { error: err.message || "Failed to update project" }
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const projectRef = doc(db, "projects", id)
      await deleteDoc(projectRef)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      return { error: null }
    } catch (err: any) {
      return { error: err.message || "Failed to delete project" }
    }
  }

  return {
    projects,
    loading,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
