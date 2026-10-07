import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyAkv2HYEYgkvUxWfyz9X-0R6htnXSkZrU4",
  authDomain: "portofolio-jinshi.firebaseapp.com",
  projectId: "portofolio-jinshi",
  storageBucket: "portofolio-jinshi.firebasestorage.app",
  messagingSenderId: "956564772380",
  appId: "1:956564772380:web:cbd26b2aff444b3f9df1d9",
  measurementId: "G-3D5ZX0CZ92",
}

// Initialize Firebase (singleton pattern for Next.js SSR / HMR)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export interface ProjectDoc {
  id: string
  title: string
  description: string
  image_url: string
  project_url: string
  tags: string[]
  created_at?: string
  updated_at?: string
  user_id?: string
  domain?: string
  metric?: string
  metricLabel?: string
}

export interface ProjectInput {
  title: string
  description: string
  image_url: string
  project_url: string
  tags: string[]
  domain?: string
  metric?: string
  metricLabel?: string
}
