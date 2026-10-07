export interface Project {
  id: string
  title: string
  description: string
  image_url: string
  project_url: string
  tags: string[]
  created_at?: string
  domain?: string
  metric?: string
  metricLabel?: string
}

export const FALLBACK_PROJECTS: Project[] = [
  {
    id: "jinsvision-ai",
    title: "JinsVision AI Lab",
    description:
      "Media enhancement platform with distributed inference pipelines. Integrated Real-ESRGAN and Topaz for video and image upscaling with low-latency S3 storage.",
    image_url: "https://up.mo0n.qzz.io/iptb4w.webp",
    project_url: "https://lab.jinshivalley.xyz",
    tags: ["Next.js", "Cloudflare D1", "AWS S3", "Topaz Video", "Real-ESRGAN"],
    domain: "AI MEDIA PIPELINE",
    metric: "4X UPSCALE",
    metricLabel: "Video & Image Super-Resolution",
  },
  {
    id: "jinxverse-stream",
    title: "JinxVerse Stream",
    description:
      "Web-based streaming platform with TMDB metadata synchronization, responsive playback pipeline, and zero layout shift.",
    image_url: "https://up.mo0n.qzz.io/cute0i.webp",
    project_url: "https://www.jinxverse.tech/",
    tags: ["Next.js", "TypeScript", "TMDB API", "Tailwind CSS"],
    domain: "STREAMING ARCHITECTURE",
    metric: "0 JANK",
    metricLabel: "Dynamic TMDB Sync & Player",
  },
  {
    id: "whatsapp-bot",
    title: "WhatsApp Autonomous Engine",
    description:
      "24/7 autonomous bot built directly on the Baileys WebSocket protocol instead of headless browsers, cutting memory footprint by 80% for persistent runtime.",
    image_url: "https://api.lauma.icu/71e6f8.jpeg",
    project_url: "https://chat.whatsapp.com/ESA4MVEwjb6BSNDYkzQlP8",
    tags: ["Node.js", "Baileys", "WebSocket", "JavaScript"],
    domain: "SYSTEMS & RUNTIME",
    metric: "-80% RAM",
    metricLabel: "WebSocket vs Headless Browser",
  },
  {
    id: "file-hosting",
    title: "High-Speed File Distribution",
    description:
      "Frictionless asset delivery service backed by Cloudflare edge caching and Supabase storage with multi-region CDN routing.",
    image_url: "https://api.lauma.icu/8807b8.jpeg",
    project_url: "https://files.jinshivalley.xyz",
    tags: ["React", "TypeScript", "Supabase", "Cloudflare"],
    domain: "STORAGE & CDN",
    metric: "<150ms TTFB",
    metricLabel: "Edge Caching & Chunked Uploads",
  },
  {
    id: "weather-web",
    title: "Realtime Weather Web",
    description:
      "Location-aware weather monitoring platform with interactive maps and 3D visual atmospheric condition states.",
    image_url: "https://api.lauma.icu/76dab2.jpeg",
    project_url: "https://weather.jinshivalley.xyz",
    tags: ["React", "TypeScript", "OpenWeather", "API"],
    domain: "GEOSPATIAL & METRICS",
    metric: "LIVE SYNC",
    metricLabel: "GPS & Map Search Coordinates",
  },
  {
    id: "space-minigames",
    title: "Cosmic Arcade Engine",
    description:
      "Compact 2D physics experiment running on a 60 FPS requestAnimationFrame loop with minimal bundle overhead.",
    image_url: "https://api.lauma.icu/2ac30d.jpeg",
    project_url: "https://cosmic.jinshivalley.xyz/",
    tags: ["React", "Canvas API", "Tailwind CSS"],
    domain: "CREATIVE WEB",
    metric: "60 FPS",
    metricLabel: "Zero Dependency Canvas Loop",
  },
]

const FIRESTORE_ENDPOINT =
  "https://firestore.googleapis.com/v1/projects/portofolio-jinshi/databases/(default)/documents/projects?key=AIzaSyAkv2HYEYgkvUxWfyz9X-0R6htnXSkZrU4"

const METADATA_DICTIONARY: Record<string, { domain: string; metric: string; metricLabel: string }> = {
  jinsvision: { domain: "AI MEDIA PIPELINE", metric: "4X UPSCALE", metricLabel: "Video & Image Super-Resolution" },
  jinxverse: { domain: "STREAMING ARCHITECTURE", metric: "0 JANK", metricLabel: "Dynamic TMDB Sync & Player" },
  whatsapp: { domain: "SYSTEMS & RUNTIME", metric: "-80% RAM", metricLabel: "WebSocket vs Headless Browser" },
  file: { domain: "STORAGE & CDN", metric: "<150ms TTFB", metricLabel: "Edge Caching & Chunked Uploads" },
  weather: { domain: "GEOSPATIAL & METRICS", metric: "LIVE SYNC", metricLabel: "GPS & Map Coordinates" },
  cosmic: { domain: "CREATIVE WEB", metric: "60 FPS", metricLabel: "Zero Dependency Canvas Loop" },
  space: { domain: "CREATIVE WEB", metric: "60 FPS", metricLabel: "Zero Dependency Canvas Loop" },
  chat: { domain: "AI CONVERSATIONAL ENGINE", metric: "<300ms TTFB", metricLabel: "Llama 4 & DeepSeek Streaming" },
  upscale: { domain: "AI VISION ENGINE", metric: "4K RESOLUTION", metricLabel: "Real-ESRGAN Model Pipeline" },
  crypto: { domain: "FINTECH TELEMETRY", metric: "REALTIME", metricLabel: "WebSocket CoinGecko Ingestion" },
  company: { domain: "ENTERPRISE CLIENT", metric: "100% SEO", metricLabel: "Next.js Static Generation" },
  courier: { domain: "LOGISTICS ARCHITECTURE", metric: "MULTI-CARRIER", metricLabel: "Unified Tracking Engine" },
}

export async function getLiveProjects(): Promise<Project[]> {
  try {
    const res = await fetch(FIRESTORE_ENDPOINT, { next: { revalidate: 300 } })
    if (!res.ok) return FALLBACK_PROJECTS
    const data = await res.json()
    if (!data.documents || !Array.isArray(data.documents)) return FALLBACK_PROJECTS

    const live: Project[] = data.documents.map((doc: any) => {
      const f = doc.fields || {}
      const id = doc.name ? doc.name.split("/").pop() : Math.random().toString()
      const title = f.title?.stringValue || "Untitled Project"
      const description = f.description?.stringValue || ""
      const image_url = f.image_url?.stringValue || ""
      const project_url = f.project_url?.stringValue || "#"
      const tags = (f.tags?.arrayValue?.values || []).map(
        (v: any) => v.stringValue || ""
      )

      // Match with predefined metrics if available
      const matched = FALLBACK_PROJECTS.find(
        (p) => p.title.toLowerCase() === title.toLowerCase() || p.id === id
      )

      // Match with keyword dictionary
      const titleLower = title.toLowerCase()
      const key = Object.keys(METADATA_DICTIONARY).find((k) => titleLower.includes(k) || id.toLowerCase().includes(k))
      const meta = key ? METADATA_DICTIONARY[key] : undefined

      return {
        id,
        title,
        description,
        image_url: image_url || matched?.image_url || "",
        project_url,
        tags: tags.length > 0 ? tags : matched?.tags || [],
        created_at: f.created_at?.timestampValue,
        domain: matched?.domain || meta?.domain || "FULLSTACK APPLICATION",
        metric: matched?.metric || meta?.metric || "ACTIVE",
        metricLabel: matched?.metricLabel || meta?.metricLabel || "Production Deployment",
      }
    })

    return live.length > 0 ? live : FALLBACK_PROJECTS
  } catch {
    return FALLBACK_PROJECTS
  }
}
