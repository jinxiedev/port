"use client"

import * as React from "react"

/**
 * Contribution Skyline — a year of activity as a GitHub-style heat map that
 * folds up into an isometric skyline, and back down again.
 *
 * It is one scene, not two charts. Every day is a box on a grid; the 2D view
 * is that grid seen straight down, the 3D view is the same grid seen from the
 * corner. Switching views swings one camera between the two while each week's
 * bars rise (or settle) in a wave from the oldest week to the newest, so the
 * flat heat map visibly becomes the skyline — nothing is swapped or cut.
 *
 * Hover or tap a day for its count, arrow keys walk the grid, hover a legend
 * swatch to isolate that level, and in 3D drag to orbit (double-click resets).
 * Palette and theme changes blend rather than flip.
 *
 * Canvas + DOM, React is the only import. Pass `data` as `{ date, count }[]`;
 * without it a seeded, believable year is generated so the demo is never empty.
 */

// #region contributions
// Pure: dates, grid, stats, levels, camera and colour maths. Lifted out and run by the test.

export type ContributionDay = { date: string; count: number }
export type Cell = { date: string; count: number; level: number; week: number; day: number }
export type Streak = { days: number; start: string | null; end: string | null }
export type ContributionStats = {
  total: number
  first: string | null
  last: string | null
  busiest: { count: number; date: string | null }
  longest: Streak
  current: Streak
}
export type RGB = [number, number, number]

export const DAY_MS = 86400000

export const clamp01 = (v: number): number => (v > 0 ? (v < 1 ? v : 1) : 0)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
export const easeInOutCubic = (x: number): number => {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}
export const easeOutCubic = (x: number): number => 1 - Math.pow(1 - clamp01(x), 3)
export const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** UTC midnight → "YYYY-MM-DD". */
export const toKey = (ms: number): string => new Date(ms).toISOString().slice(0, 10)

/**
 * Any date-ish value → UTC midnight of its calendar day. "YYYY-MM-DD" strings
 * are read literally (no timezone drift), Date objects by their local day,
 * numbers as UTC timestamps.
 */
export const dayMs = (v: string | number | Date): number => {
  if (typeof v === "number") return Math.floor(v / DAY_MS) * DAY_MS
  if (typeof v === "string") {
    const m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(v)
    if (m) return Date.UTC(+m[1], +m[2] - 1, +m[3])
    v = new Date(v)
  }
  return Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())
}

/** mulberry32 — small, fast, deterministic. */
export const rng = (seed: number) => {
  let a = seed >>> 0
  return (): number => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A believable year for demos: quiet weekends, a few busy seasons, a mood that
 * drifts week to week, and the odd enormous day.
 */
export const generateContributions = (endMs: number, seed = 7, days = 371): ContributionDay[] => {
  const r = rng(seed)
  const bursts = Array.from({ length: 4 }, () => ({ at: r(), width: 0.035 + r() * 0.07, gain: 0.6 + r() * 1.1 }))
  const out: ContributionDay[] = []
  let mood = 0.5
  for (let i = 0; i < days; i++) {
    const ms = endMs - (days - 1 - i) * DAY_MS
    const x = i / Math.max(1, days - 1)
    const dow = new Date(ms).getUTCDay()
    const weekend = dow === 0 || dow === 6
    let heat = 0.2
    for (const b of bursts) heat += b.gain * Math.exp(-((x - b.at) ** 2) / (2 * b.width ** 2))
    mood = mood * 0.85 + r() * 0.15
    heat *= 0.55 + mood * 0.9
    const pActive = Math.min(0.94, (weekend ? 0.22 : 0.5) + heat * 0.4)
    let count = 0
    if (r() < pActive) count = 1 + Math.floor(-Math.log(1 - r()) * (1.2 + heat * 7) * (weekend ? 0.5 : 1))
    if (r() < 0.01) count += 18 + Math.floor(r() * 24)
    out.push({ date: toKey(ms), count })
  }
  return out
}

/**
 * The grid: columns are weeks, rows are weekdays (row 0 = `weekStart`). It
 * ends on `endMs` and starts on the week containing the day one year earlier.
 * Levels 1–4 split the non-zero days by their share of a busy day — the 95th
 * percentile, so one freak day can't wash every other day out to level 1.
 */
export const buildGrid = (data: ContributionDay[], endMs: number, weekStart = 0) => {
  const counts = new Map<string, number>()
  for (const d of data) {
    if (!d || typeof d.date !== "string") continue
    const ms = dayMs(d.date)
    const c = Number(d.count)
    if (!Number.isFinite(ms) || !(c > 0) || !Number.isFinite(c)) continue
    const k = toKey(ms)
    counts.set(k, (counts.get(k) ?? 0) + c)
  }
  let start = endMs - 364 * DAY_MS
  start -= ((new Date(start).getUTCDay() - weekStart + 7) % 7) * DAY_MS
  const cells: Cell[] = []
  for (let ms = start, i = 0; ms <= endMs; ms += DAY_MS, i++) {
    const date = toKey(ms)
    cells.push({ date, count: counts.get(date) ?? 0, level: 0, week: Math.floor(i / 7), day: i % 7 })
  }
  const nz = cells.map((c) => c.count).filter((c) => c > 0).sort((a, b) => a - b)
  const busy = nz.length ? nz[Math.floor(0.95 * (nz.length - 1))] : 0
  for (const c of cells) c.level = levelOf(c.count, busy)
  return { cells, weeks: cells.length ? cells[cells.length - 1].week + 1 : 0, max: nz.length ? nz[nz.length - 1] : 0 }
}

/** 0 for an empty day, else 1–4 by quarters of `busy`. Anything at or past `busy` is 4. */
export const levelOf = (count: number, busy: number): number =>
  count <= 0 ? 0 : busy <= 0 ? 4 : 1 + Math.min(3, Math.floor((count / busy) * 4))

/** Total, busiest day, longest run, and the run that reaches today (or yesterday — today isn't over). */
export const computeStats = (cells: Cell[]): ContributionStats => {
  let total = 0
  let best = 0
  let bestDate: string | null = null
  let run = 0
  let runStart: string | null = null
  let longest: Streak = { days: 0, start: null, end: null }
  for (const c of cells) {
    total += c.count
    if (c.count > best) {
      best = c.count
      bestDate = c.date
    }
    if (c.count > 0) {
      if (run === 0) runStart = c.date
      run++
      if (run > longest.days) longest = { days: run, start: runStart, end: c.date }
    } else run = 0
  }
  let j = cells.length - 1
  if (j >= 0 && cells[j].count === 0) j--
  const endAt = j
  while (j >= 0 && cells[j].count > 0) j--
  const days = endAt - j
  const current: Streak = days > 0 ? { days, start: cells[j + 1].date, end: cells[endAt].date } : { days: 0, start: null, end: null }
  return {
    total,
    first: cells.length ? cells[0].date : null,
    last: cells.length ? cells[cells.length - 1].date : null,
    busiest: { count: best, date: bestDate },
    longest,
    current,
  }
}

/** A label on each week whose first day starts a new month; a cramped first label is dropped. */
export const monthLabels = (cells: Cell[], weeks: number, locale = "en-US") => {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" })
  const out: { week: number; label: string }[] = []
  let prev = -1
  for (let w = 0; w < weeks; w++) {
    const c = cells[w * 7]
    if (!c) break
    const m = +c.date.slice(5, 7)
    if (m !== prev) out.push({ week: w, label: fmt.format(dayMs(c.date)) })
    prev = m
  }
  if (out.length > 1 && out[1].week - out[0].week < 3) out.shift()
  return out
}

/** Box height in grid units. Empty days are thin slabs; the busiest day is ~7.6 cells tall. */
export const barHeight = (count: number, max: number, scale = 1): number =>
  count > 0 && max > 0 ? 0.4 + Math.pow(count / max, 0.85) * 7.2 * scale : 0.2

/** Share of the morph each bar spends waiting — the wave sweeps oldest week → newest. */
export const WAVE = 0.42

/** 0 → 1 as a bar rises during the morph. Every bar is flat at t=0 and fully up at t=1. */
export const riseAt = (t: number, week: number, weeks: number, day: number): number => {
  const d = (weeks > 1 ? week / (weeks - 1) : 0) * 0.36 + (day / 6) * 0.06
  return easeOutCubic((t - d) / (1 - WAVE))
}

export const YAW_3D = Math.PI / 4
export const ELEV_3D = (34 * Math.PI) / 180
export const YAW_RANGE: [number, number] = [(8 * Math.PI) / 180, (82 * Math.PI) / 180]
export const ELEV_RANGE: [number, number] = [(18 * Math.PI) / 180, (62 * Math.PI) / 180]

export type Cam = { cs: number; sn: number; se: number; ce: number }

/**
 * e=0 looks straight down (yaw 0, elevation 90°): x across, y down, height
 * invisible — a plain heat map. e=1 is the isometric corner view. Orbit
 * offsets only apply in proportion to e, so the flat view never tilts.
 */
export const camera = (e: number, dYaw = 0, dElev = 0): Cam => {
  const yaw = Math.min(YAW_RANGE[1], Math.max(0, lerp(0, YAW_3D + dYaw, e)))
  const elev = lerp(Math.PI / 2, Math.min(ELEV_RANGE[1], Math.max(ELEV_RANGE[0], ELEV_3D + dElev)), e)
  return { cs: Math.cos(yaw), sn: Math.sin(yaw), se: Math.sin(elev), ce: Math.cos(elev) }
}

/** World (x = week, y = weekday, z = up) → screen, before scale/offset. */
export const project = (c: Cam, x: number, y: number, z: number): [number, number] => [
  x * c.cs - y * c.sn,
  (x * c.sn + y * c.cs) * c.se - z * c.ce,
]

/** Painter's depth for yaw in [0°, 90°]: larger is nearer the viewer, so draw ascending. */
export const depthOf = (c: Cam, x: number, y: number): number => x * c.sn + y * c.cs

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const luminance = (c: RGB): number => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

export type PaletteName = "github" | "halloween" | "ocean" | "ember" | "grape" | "mono"
export type PaletteInput = PaletteName | string[] | { light: string[]; dark: string[] }

/** Four colours per theme, lightest activity → heaviest. */
export const PALETTES: Record<PaletteName, { light: string[]; dark: string[] }> = {
  github: { light: ["#c6e48b", "#7bc96f", "#239a3b", "#196127"], dark: ["#0e4429", "#006d32", "#26a641", "#39d353"] },
  halloween: { light: ["#ffee4a", "#ffc501", "#fe9600", "#b33c00"], dark: ["#631c03", "#bd561d", "#fa7a18", "#fddf68"] },
  ocean: { light: ["#b8e3f5", "#6ec3eb", "#2a8fd1", "#0b4f8a"], dark: ["#0c2d4a", "#12508a", "#2a88d8", "#7cc7ff"] },
  ember: { light: ["#fde2c4", "#fbad6e", "#f06b3a", "#b3261e"], dark: ["#4a1a10", "#8f2f16", "#e0572a", "#ffa46b"] },
  grape: { light: ["#e4d4fb", "#b794f4", "#805ad5", "#44337a"], dark: ["#2d1f4f", "#553c9a", "#8b5cf6", "#c4b5fd"] },
  mono: { light: ["#d4d4d4", "#a3a3a3", "#525252", "#171717"], dark: ["#333333", "#5c5c5c", "#a3a3a3", "#fafafa"] },
}

export const resolvePalette = (p: PaletteInput | undefined, dark: boolean): string[] => {
  const pick = Array.isArray(p) ? p : typeof p === "object" && p ? (dark ? p.dark : p.light) : PALETTES[(p as PaletteName) ?? "github"] ? PALETTES[p as PaletteName][dark ? "dark" : "light"] : PALETTES.github[dark ? "dark" : "light"]
  const base = PALETTES.github[dark ? "dark" : "light"]
  return [0, 1, 2, 3].map((i) => pick[i] ?? pick[pick.length - 1] ?? base[i])
}
// #endregion

type View = "2d" | "3d"

export interface ContributionSkylineProps {
  /** One entry per day, `YYYY-MM-DD`. Repeated dates add up. Omit for a generated sample year. */
  data?: ContributionDay[]
  /** Last day shown. Defaults to the latest date in `data`, or today. */
  endDate?: string | Date
  /** Controlled view. */
  view?: View
  /** Uncontrolled starting view. The 3D view rises out of the flat one when it first scrolls into sight. */
  defaultView?: View
  onViewChange?: (view: View) => void
  /** A preset, four colours, or `{ light, dark }` sets of four. */
  palette?: PaletteInput
  /** Heading. Defaults to "{total} contributions in the last year". */
  title?: React.ReactNode
  /** Singular noun for a unit of activity. */
  unit?: string
  /** Plural noun. Defaults to `unit + "s"`. */
  unitPlural?: string
  /** Multiplies bar heights in 3D. */
  heightScale?: number
  /** Morph length, ms. */
  duration?: number
  /** 0 puts Sunday on the top row, 1 puts Monday there. */
  weekStart?: 0 | 1
  /** Drag to orbit in 3D. */
  orbit?: boolean
  showStats?: boolean
  showLegend?: boolean
  showToggle?: boolean
  /** Replaces the hint under the chart. `null` renders none. */
  footer?: React.ReactNode
  locale?: string
  /** Seed for the generated sample year. */
  seed?: number
  onCellClick?: (day: ContributionDay) => void
  className?: string
}

const FG_FALLBACK: RGB = [237, 232, 223]
const BG_FALLBACK: RGB = [12, 12, 16]

// Any CSS colour → sRGB, by letting the browser paint it. Handles oklch, color-mix, names…
let probe: CanvasRenderingContext2D | null = null
const toRGB = (color: string, fallback: RGB | null): RGB | null => {
  if (typeof document === "undefined") return fallback
  if (!probe) {
    const c = document.createElement("canvas")
    c.width = c.height = 1
    probe = c.getContext("2d", { willReadFrequently: true })
  }
  if (!probe) return fallback
  probe.clearRect(0, 0, 1, 1)
  probe.fillStyle = "rgba(0,0,0,0)"
  probe.fillStyle = color
  probe.fillRect(0, 0, 1, 1)
  const d = probe.getImageData(0, 0, 1, 1).data
  if (d[3] < 8) return fallback
  return [d[0], d[1], d[2]]
}

const rgbString = (r: number, g: number, b: number) => "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")"

const pointInQuad = (p: Float32Array, o: number, x: number, y: number): boolean => {
  let sign = 0
  for (let k = 0; k < 4; k++) {
    const ax = p[o + k * 2]
    const ay = p[o + k * 2 + 1]
    const bx = p[o + ((k + 1) % 4) * 2]
    const by = p[o + ((k + 1) % 4) * 2 + 1]
    const cross = (bx - ax) * (y - ay) - (by - ay) * (x - ax)
    if (Math.abs(cross) < 1e-9) continue
    const s = cross > 0 ? 1 : -1
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return sign !== 0
}

const quadPath = (ctx: CanvasRenderingContext2D, p: Float32Array, o: number, r: number) => {
  if (r < 0.3) {
    ctx.moveTo(p[o], p[o + 1])
    ctx.lineTo(p[o + 2], p[o + 3])
    ctx.lineTo(p[o + 4], p[o + 5])
    ctx.lineTo(p[o + 6], p[o + 7])
    ctx.closePath()
    return
  }
  ctx.moveTo((p[o + 6] + p[o]) / 2, (p[o + 7] + p[o + 1]) / 2)
  for (let k = 0; k < 4; k++) {
    const b = (k + 1) % 4
    ctx.arcTo(p[o + k * 2], p[o + k * 2 + 1], p[o + b * 2], p[o + b * 2 + 1], r)
  }
  ctx.closePath()
}

const GridIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ maxWidth: "none" }}>
    <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
    <rect x="9" y="9" width="5.5" height="5.5" rx="1" fill="currentColor" />
  </svg>
)

const CubeIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" style={{ maxWidth: "none" }}>
    <path d="M8 1.2 14.2 4.6v6.8L8 14.8 1.8 11.4V4.6Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M1.8 4.6 8 8l6.2-3.4M8 8v6.8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)

const MUTED = "rgba(237, 232, 223, 0.5)"

function Stat({
  label,
  value,
  unit,
  sub,
  accent,
  size,
  align,
}: {
  label: string
  value: string
  unit: string
  sub: string
  accent: string
  size: number
  align: "start" | "end" | "stack"
}) {
  const isEnd = align === "end"
  const isStack = align === "stack"

  return (
    <div
      className={`min-w-0 flex flex-col ${
        isEnd ? "items-end text-right" : "items-start text-left"
      }`}
    >
      <div className="text-[12px] font-mono tracking-wider uppercase leading-snug" style={{ color: MUTED }}>
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className="font-semibold tabular-nums leading-none tracking-tight transition-colors duration-500 motion-reduce:transition-none"
          style={{ color: accent, fontSize: size, letterSpacing: "-0.02em" }}
        >
          {value}
        </span>
        <span className="text-[13px] font-medium leading-none text-white/70">
          {unit}
        </span>
      </div>
      <div
        className={`mt-1 text-[11px] font-mono leading-tight ${isStack ? "truncate max-w-[200px]" : "whitespace-nowrap"}`}
        style={{ color: MUTED }}
      >
        {sub}
      </div>
    </div>
  )
}

export default function ContributionSkyline({
  data,
  endDate,
  view: viewProp,
  defaultView = "3d",
  onViewChange,
  palette = "github",
  title,
  unit = "contribution",
  unitPlural,
  heightScale = 1,
  duration = 1300,
  weekStart = 0,
  orbit = true,
  showStats = true,
  showLegend = true,
  showToggle = true,
  footer,
  locale = "en-US",
  seed = 7,
  onCellClick,
  className = "",
}: ContributionSkylineProps) {
  const endKey = endDate == null ? null : dayMs(endDate)
  const model = React.useMemo(() => {
    const dates = (data ?? []).map((d) => dayMs(d.date)).filter(Number.isFinite)
    const end = endKey ?? (dates.length ? Math.max(...dates) : dayMs(new Date()))
    const days = data ?? generateContributions(end, seed)
    const grid = buildGrid(days, end, weekStart)
    return { ...grid, stats: computeStats(grid.cells), months: monthLabels(grid.cells, grid.weeks, locale) }
  }, [data, endKey, seed, weekStart, locale])

  const [innerView, setInnerView] = React.useState<View>(defaultView)
  const view = viewProp ?? innerView
  const setView = (v: View) => {
    if (viewProp === undefined) setInnerView(v)
    onViewChange?.(v)
  }

  const [theme, setTheme] = React.useState<{ dark: boolean; swatches: string[]; accent: string }>(() => {
    const p = resolvePalette(palette, true)
    return { dark: true, swatches: ["#18181f", ...p], accent: p[3] }
  })
  const [width, setWidth] = React.useState(0)
  const [active, setActive] = React.useState(-1)
  const [legendLevel, setLegendLevel] = React.useState(-1)
  const [announce, setAnnounce] = React.useState("")

  const rootRef = React.useRef<HTMLElement>(null)
  const stageRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)
  const engine = React.useRef<{ kick: () => void; load: () => void; retheme: () => void; tipWidth: (w: number) => void } | null>(null)

  const plural = unitPlural ?? unit + "s"
  const nf = React.useMemo(() => new Intl.NumberFormat(locale), [locale])
  const df = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" }), [locale])
  const ydf = React.useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }), [locale])
  const ldf = React.useMemo(() => new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }), [locale])

  const noun = (w: number) => (w === 1 ? unit : plural)
  const describe = (w: number) => {
    const ot = model.cells[w]
    return ot ? (ot.count ? nf.format(ot.count) + " " + noun(ot.count) : "No " + plural) + " on " + ldf.format(dayMs(ot.date)) : ""
  }

  const state = React.useRef({
    model,
    duration,
    heightScale,
    orbit,
    palette,
    legendLevel,
    onCellClick,
    target: view === "3d" ? 1 : 0,
    setActive,
    setWidth,
    setTheme,
    setAnnounce,
    describe,
  })

  state.current = {
    model,
    duration,
    heightScale,
    orbit,
    palette,
    legendLevel,
    onCellClick,
    target: view === "3d" ? 1 : 0,
    setActive,
    setWidth,
    setTheme,
    setAnnounce,
    describe,
  }

  React.useEffect(() => {
    const root = rootRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    const tip = tipRef.current
    if (!root || !stage || !canvas || !tip) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)")
    let reducedMotion = motionQuery.matches

    let e = 0
    let targetE = 0
    let entered = false

    let yawOff = 0
    let elevOff = 0
    let targetYawOff = 0
    let targetElevOff = 0

    let stageWidth = 0
    let labelMargin = 0
    let weekdayWidth = 30
    let dpr = 1
    let height2D = 0
    let height3D = 0
    let totalHeight = 0
    let lastHeight = -1
    let font = "10px sans-serif"

    const palCurrent = new Float32Array(15)
    const palTarget = new Float32Array(15)
    let palInited = false

    let fg: RGB = FG_FALLBACK
    let bg: RGB = BG_FALLBACK
    let isDark = false

    let cellCount = 0
    let weekCount = 0

    let cWeeks = new Float32Array(0)
    let cDays = new Float32Array(0)
    let cLevels = new Uint8Array(0)
    let cMaxH = new Float32Array(0)
    let cHeights = new Float32Array(0)
    let cActiveElev = new Float32Array(0)
    let cDim = new Float32Array(0)
    let cQuads = new Float32Array(0)
    let cVis = new Uint8Array(0)
    let cSortOrder: number[] = []

    let months: { week: number; label: string }[] = []
    let weekdays: { day: number; label: string }[] = []

    let hoverIdx = -1
    let pinIdx = -1
    let activeIdx = -1
    let tipW = 0
    let raf = 0
    let lastTime = 0

    const load = () => {
      const m = state.current.model
      cellCount = m.cells.length
      weekCount = m.weeks
      if (cWeeks.length !== cellCount) {
        cWeeks = new Float32Array(cellCount)
        cDays = new Float32Array(cellCount)
        cLevels = new Uint8Array(cellCount)
        cMaxH = new Float32Array(cellCount)
        cHeights = new Float32Array(cellCount)
        cActiveElev = new Float32Array(cellCount)
        cDim = new Float32Array(cellCount)
        cQuads = new Float32Array(cellCount * 24)
        cVis = new Uint8Array(cellCount)
        cSortOrder = Array.from({ length: cellCount }, (_, i) => i)
      }
      for (let i = 0; i < cellCount; i++) {
        const c = m.cells[i]
        cWeeks[i] = c.week
        cDays[i] = c.day
        cLevels[i] = c.level
        cMaxH[i] = barHeight(c.count, m.max, state.current.heightScale)
      }
      months = m.months
      const dayFmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" })
      weekdays = []
      for (let i = 0; i < 7 && i < cellCount; i++) {
        const dow = new Date(dayMs(m.cells[i].date)).getUTCDay()
        if (dow === 1 || dow === 3 || dow === 5) {
          weekdays.push({ day: i, label: dayFmt.format(dayMs(m.cells[i].date)) })
        }
      }
      if (hoverIdx >= cellCount) hoverIdx = -1
      if (pinIdx >= cellCount) pinIdx = -1
    }

    const retheme = () => {
      const style = getComputedStyle(root)
      fg = toRGB(style.color, FG_FALLBACK) ?? FG_FALLBACK
      const bodyBg = typeof document !== "undefined" ? getComputedStyle(document.body).backgroundColor : null
      bg = toRGB(style.backgroundColor, null) ?? toRGB(bodyBg ?? "", null) ?? BG_FALLBACK
      isDark = luminance(bg) < 0.5 || luminance(fg) > 0.5
      font = "400 10px " + (style.fontFamily || "sans-serif")

      const pal = resolvePalette(state.current.palette, isDark)
      const swatches = [mixRGB(bg, fg, isDark ? 0.11 : 0.075), ...pal.map((c) => toRGB(c, FG_FALLBACK) ?? FG_FALLBACK)]
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
          palTarget[i * 3 + j] = swatches[i][j]
        }
      }
      if (!palInited || reducedMotion) {
        palCurrent.set(palTarget)
        palInited = true
      }
      ctx.font = font
      weekdayWidth = Math.ceil(Math.max(20, ...weekdays.map((w) => ctx.measureText(w.label).width))) + 8

      const swStrings = swatches.map((s) => rgbString(s[0], s[1], s[2]))
      state.current.setTheme((prev) =>
        prev.dark === isDark && prev.swatches.join() === swStrings.join()
          ? prev
          : { dark: isDark, swatches: swStrings, accent: swStrings[4] }
      )
      kick()
    }

    const extent = (cam: Cam, t: number, flat: boolean) => {
      const inset = lerp(0.78, 0.9, t)
      const pad = (1 - inset) / 2
      let minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity
      const add = (x: number, y: number, z: number) => {
        const p = project(cam, x, y, z)
        if (p[0] < minx) minx = p[0]
        if (p[0] > maxx) maxx = p[0]
        if (p[1] < miny) miny = p[1]
        if (p[1] > maxy) maxy = p[1]
      }
      for (let i = 0; i < cellCount; i++) {
        const x = cWeeks[i] + pad
        const y = cDays[i] + pad
        const z = flat ? cMaxH[i] * t : cHeights[i]
        add(x, y, z)
        add(x + inset, y, z)
        add(x, y + inset, z)
        add(x + inset, y + inset, 0)
        add(x, y + inset, 0)
        add(x + inset, y, 0)
      }
      add(0, 7 + 1.5 * t, 0)
      add(weekCount, 7 + 1.5 * t, 0)
      return { minx, maxx, miny, maxy }
    }

    const relayout = () => {
      const w = Math.round(stage.clientWidth)
      if (!w || !cellCount) return
      stageWidth = w
      labelMargin = stageWidth < 520 ? 0 : weekdayWidth
      dpr = Math.min(2, window.devicePixelRatio || 1)

      const ext2D = extent(camera(0), 0, true)
      height2D = 24 + ((ext2D.maxy - ext2D.miny) / (ext2D.maxx - ext2D.minx)) * (stageWidth - labelMargin - 4)

      const ext3D = extent(camera(1), 1, true)
      const scaled3D = ((ext3D.maxy - ext3D.miny) / (ext3D.maxx - ext3D.minx)) * (stageWidth - 40) + 40
      height3D = Math.max(Math.min(scaled3D, stageWidth * 0.72, 620), Math.min(scaled3D, 240))
      totalHeight = Math.ceil(Math.max(height2D, height3D))

      canvas.width = Math.round(stageWidth * dpr)
      canvas.height = Math.round(totalHeight * dpr)
      canvas.style.width = stageWidth + "px"
      canvas.style.height = totalHeight + "px"
      lastHeight = -1
      state.current.setWidth(stageWidth)
      draw()
    }

    const draw = () => {
      if (!stageWidth || !cellCount) return
      const t = easeInOutCubic(e)
      const cam = camera(t, yawOff, elevOff)
      const currentHeight = lerp(height2D, height3D, t)
      if (Math.abs(currentHeight - lastHeight) > 0.2) {
        stage.style.height = currentHeight.toFixed(1) + "px"
        lastHeight = currentHeight
      }

      for (let i = 0; i < cellCount; i++) {
        cHeights[i] = riseAt(e, cWeeks[i], weekCount, cDays[i]) * cMaxH[i]
      }

      const ext = extent(cam, t, false)
      const padY = lerp(2, 20, t)
      const padLeft = padY + labelMargin * (1 - t)
      const padTop = padY + 20 * (1 - t)
      const availW = stageWidth - padLeft - padY
      const availH = currentHeight - padTop - padY
      const spanX = Math.max(1e-6, ext.maxx - ext.minx)
      const spanY = Math.max(1e-6, ext.maxy - ext.miny)
      const scale = Math.min(availW / spanX, availH / spanY)
      const offX = padLeft + (availW - spanX * scale) / 2 - ext.minx * scale
      const offY = padTop + (availH - spanY * scale) / 2 - ext.miny * scale

      const { cs, sn, se, ce } = cam
      const px = (x: number, y: number) => offX + (x * cs - y * sn) * scale
      const py = (x: number, y: number, z: number) => offY + ((x * sn + y * cs) * se - z * ce) * scale

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, stageWidth, totalHeight)

      cSortOrder.sort((a, b) => (cWeeks[a] + 0.5) * sn + (cDays[a] + 0.5) * cs - ((cWeeks[b] + 0.5) * sn + (cDays[b] + 0.5) * cs))

      const boxSize = lerp(0.78, 0.9, t)
      const boxPad = (1 - boxSize) / 2
      const radius = lerp(0.17, 0.03, t) * scale
      const outlineAlpha = (1 - t) * 0.07
      const activeRise = 0.7 * t
      const [r0, g0, b0] = [palCurrent[0], palCurrent[1], palCurrent[2]]

      for (let i = 0; i < cellCount; i++) {
        const idx = cSortOrder[i]
        const wx = cWeeks[idx] + boxPad
        const wy = cDays[idx] + boxPad
        const wx2 = wx + boxSize
        const wy2 = wy + boxSize
        const bz = cHeights[idx] + cActiveElev[idx] * activeRise
        const o = idx * 24

        // Top face
        cQuads[o] = px(wx, wy); cQuads[o + 1] = py(wx, wy, bz)
        cQuads[o + 2] = px(wx2, wy); cQuads[o + 3] = py(wx2, wy, bz)
        cQuads[o + 4] = px(wx2, wy2); cQuads[o + 5] = py(wx2, wy2, bz)
        cQuads[o + 6] = px(wx, wy2); cQuads[o + 7] = py(wx, wy2, bz)

        // Side 1 (front-facing)
        cQuads[o + 8] = px(wx, wy2); cQuads[o + 9] = py(wx, wy2, 0)
        cQuads[o + 10] = px(wx2, wy2); cQuads[o + 11] = py(wx2, wy2, 0)
        cQuads[o + 12] = cQuads[o + 4]; cQuads[o + 13] = cQuads[o + 5]
        cQuads[o + 14] = cQuads[o + 6]; cQuads[o + 15] = cQuads[o + 7]

        // Side 2 (right-facing)
        cQuads[o + 16] = px(wx2, wy); cQuads[o + 17] = py(wx2, wy, 0)
        cQuads[o + 18] = cQuads[o + 10]; cQuads[o + 19] = cQuads[o + 11]
        cQuads[o + 20] = cQuads[o + 4]; cQuads[o + 21] = cQuads[o + 5]
        cQuads[o + 22] = cQuads[o + 2]; cQuads[o + 23] = cQuads[o + 3]

        const zProj = bz * ce * scale
        let vis = 0
        if (zProj > 0.35 && boxSize * cs * scale > 0.35) vis |= 1
        if (zProj > 0.35 && boxSize * sn * scale > 0.35) vis |= 2
        cVis[idx] = vis

        const swatchIdx = cLevels[idx] * 3
        let cr = palCurrent[swatchIdx]
        let cg = palCurrent[swatchIdx + 1]
        let cb = palCurrent[swatchIdx + 2]

        const dim = cDim[idx]
        if (dim > 0.002) {
          cr += (r0 - cr) * 0.72 * dim
          cg += (g0 - cg) * 0.72 * dim
          cb += (b0 - cb) * 0.72 * dim
        }

        const activeElev = cActiveElev[idx]
        if (activeElev > 0.002) {
          const factor = 0.16 * activeElev
          cr += (fg[0] - cr) * factor
          cg += (fg[1] - cg) * factor
          cb += (fg[2] - cb) * factor
        }

        if (vis & 1) {
          ctx.beginPath()
          quadPath(ctx, cQuads, o + 8, 0)
          ctx.fillStyle = rgbString(cr * 0.84, cg * 0.84, cb * 0.84)
          ctx.fill()
        }
        if (vis & 2) {
          ctx.beginPath()
          quadPath(ctx, cQuads, o + 16, 0)
          ctx.fillStyle = rgbString(cr * 0.68, cg * 0.68, cb * 0.68)
          ctx.fill()
        }

        ctx.beginPath()
        quadPath(ctx, cQuads, o, radius)
        ctx.fillStyle = rgbString(cr, cg, cb)
        ctx.fill()

        if (outlineAlpha > 0.004) {
          ctx.strokeStyle = `rgba(${fg[0]},${fg[1]},${fg[2]},${outlineAlpha.toFixed(3)})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
        if (activeElev > 0.02) {
          ctx.strokeStyle = `rgba(${fg[0]},${fg[1]},${fg[2]},${(0.85 * activeElev).toFixed(3)})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      const textCol = mixRGB(bg, fg, 0.55)
      ctx.font = font
      const alpha2D = 1 - smoothstep(0, 0.4, t)
      const alpha3D = smoothstep(0.62, 1, t)

      if (alpha2D > 0.004) {
        ctx.fillStyle = `rgba(${Math.round(textCol[0])},${Math.round(textCol[1])},${Math.round(textCol[2])},${alpha2D.toFixed(3)})`
        ctx.textAlign = "left"
        ctx.textBaseline = "bottom"
        let lastMonthX = -Infinity
        for (const m of months) {
          const lx = px(m.week + boxPad, -0.3)
          const lw = ctx.measureText(m.label).width
          if (lx >= lastMonthX && lx + lw <= stageWidth) {
            ctx.fillText(m.label, lx, py(m.week + boxPad, -0.3, 0) - 3)
            lastMonthX = lx + lw + 6
          }
        }
        ctx.textAlign = "right"
        ctx.textBaseline = "middle"
        if (labelMargin > 0) {
          for (const d of weekdays) {
            ctx.fillText(d.label, px(0, d.day + 0.5) - 6, py(0, d.day + 0.5, 0))
          }
        }
      }

      if (alpha3D > 0.004) {
        ctx.fillStyle = `rgba(${Math.round(textCol[0])},${Math.round(textCol[1])},${Math.round(textCol[2])},${alpha3D.toFixed(3)})`
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        let lastMonthX = -Infinity
        for (const m of months) {
          const lx = px(m.week + 0.5, 7.3)
          const lw = ctx.measureText(m.label).width
          if (lx >= lastMonthX && lx + lw <= stageWidth) {
            ctx.fillText(m.label, lx, py(m.week + 0.5, 7.3, 0) + 2)
            lastMonthX = lx + lw + 10
          }
        }
      }

      if (activeIdx >= 0 && activeIdx < cellCount) {
        const idx = activeIdx
        const bz = cHeights[idx] + cActiveElev[idx] * activeRise
        const tipX = px(cWeeks[idx] + 0.5, cDays[idx] + 0.5)
        const tipY = Math.min(
          py(cWeeks[idx] + boxPad, cDays[idx] + boxPad, bz),
          py(cWeeks[idx] + boxPad + boxSize, cDays[idx] + boxPad, bz),
          py(cWeeks[idx] + boxPad, cDays[idx] + boxPad + boxSize, bz)
        )
        const halfTip = tipW / 2
        const clampedX = Math.min(stageWidth - halfTip - 2, Math.max(halfTip + 2, tipX))
        tip.style.transform = `translate(${(clampedX - halfTip).toFixed(1)}px,${(tipY - 8).toFixed(1)}px) translateY(-100%)`
        tip.style.setProperty("--arrow", `${(tipX - clampedX + halfTip).toFixed(1)}px`)
      }
    }

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000))
      lastTime = now
      let moving = false

      if (e !== targetE) {
        const step = reducedMotion ? 1 : (dt * 1000) / Math.max(1, state.current.duration)
        e = targetE > e ? Math.min(targetE, e + step) : Math.max(targetE, e - step)
        moving = true
      }

      const orbitRate = reducedMotion ? 1 : 1 - Math.exp(-dt * 12)
      yawOff += (targetYawOff - yawOff) * orbitRate
      elevOff += (targetElevOff - elevOff) * orbitRate
      if (Math.abs(targetYawOff - yawOff) > 1e-4 || Math.abs(targetElevOff - elevOff) > 1e-4) {
        moving = true
      } else {
        yawOff = targetYawOff
        elevOff = targetElevOff
      }

      const palRate = reducedMotion ? 1 : 1 - Math.exp(-dt * 7)
      for (let i = 0; i < 15; i++) {
        const diff = palTarget[i] - palCurrent[i]
        if (Math.abs(diff) > 0.4) {
          palCurrent[i] += diff * palRate
          moving = true
        } else {
          palCurrent[i] = palTarget[i]
        }
      }

      const activeRate = reducedMotion ? 1 : 1 - Math.exp(-dt * 16)
      const dimRate = reducedMotion ? 1 : 1 - Math.exp(-dt * 10)
      const targetLegend = state.current.legendLevel

      for (let i = 0; i < cellCount; i++) {
        const targetActive = i === activeIdx ? 1 : 0
        const targetDim = targetLegend >= 0 && cLevels[i] !== targetLegend ? 1 : 0
        const curActive = cActiveElev[i]
        const curDim = cDim[i]

        if (curActive !== targetActive) {
          cActiveElev[i] = Math.abs(targetActive - curActive) < 0.003 ? targetActive : curActive + (targetActive - curActive) * activeRate
          moving = true
        }
        if (curDim !== targetDim) {
          cDim[i] = Math.abs(targetDim - curDim) < 0.003 ? targetDim : curDim + (targetDim - curDim) * dimRate
          moving = true
        }
      }

      draw()
      if (moving) raf = requestAnimationFrame(tick)
    }

    const kick = () => {
      if (!raf) {
        lastTime = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    const refreshActive = () => {
      const idx = hoverIdx >= 0 ? hoverIdx : pinIdx
      if (idx !== activeIdx) {
        activeIdx = idx
        state.current.setActive(idx)
        kick()
      }
    }

    const hit = (x: number, y: number): number => {
      for (let i = cellCount - 1; i >= 0; i--) {
        const idx = cSortOrder[i]
        const o = idx * 24
        if (
          pointInQuad(cQuads, o, x, y) ||
          ((cVis[idx] & 1) && pointInQuad(cQuads, o + 8, x, y)) ||
          ((cVis[idx] & 2) && pointInQuad(cQuads, o + 16, x, y))
        ) {
          return idx
        }
      }
      return -1
    }

    const localCoords = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect()
      return [e.clientX - r.left, e.clientY - r.top]
    }

    let drag: { id: number; x: number; y: number; yaw: number; elev: number; moved: boolean; orbit: boolean; mouse: boolean } | null = null

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.button !== 0) return
      const isOrbit = state.current.orbit && targetE === 1
      drag = {
        id: ev.pointerId,
        x: ev.clientX,
        y: ev.clientY,
        yaw: targetYawOff,
        elev: targetElevOff,
        moved: false,
        orbit: isOrbit,
        mouse: ev.pointerType === "mouse",
      }
      if (isOrbit) {
        try {
          canvas.setPointerCapture(ev.pointerId)
        } catch {}
      }
    }

    const onPointerMove = (ev: PointerEvent) => {
      if (drag && drag.orbit && ev.pointerId === drag.id) {
        const dx = ev.clientX - drag.x
        const dy = ev.clientY - drag.y
        if (drag.moved || Math.hypot(dx, dy) > 4) {
          drag.moved = true
          targetYawOff = Math.min(YAW_RANGE[1] - YAW_3D, Math.max(YAW_RANGE[0] - YAW_3D, drag.yaw + dx * 0.006))
          if (drag.mouse) {
            targetElevOff = Math.min(ELEV_RANGE[1] - ELEV_3D, Math.max(ELEV_RANGE[0] - ELEV_3D, drag.elev + dy * 0.004))
          }
          canvas.style.cursor = "grabbing"
          hoverIdx = -1
          refreshActive()
          kick()
          return
        }
      }

      if (ev.pointerType !== "mouse") return
      const [lx, ly] = localCoords(ev)
      const h = hit(lx, ly)
      if (h !== hoverIdx) {
        hoverIdx = h
        refreshActive()
      }
      canvas.style.cursor = state.current.orbit && targetE === 1 ? "grab" : h >= 0 ? "pointer" : "default"
    }

    const onPointerUp = (ev: PointerEvent) => {
      if (!drag || ev.pointerId !== drag.id) return
      const moved = drag.moved
      drag = null
      if (canvas.hasPointerCapture(ev.pointerId)) {
        canvas.releasePointerCapture(ev.pointerId)
      }
      canvas.style.cursor = state.current.orbit && targetE === 1 ? "grab" : "default"
      if (moved) return

      const [lx, ly] = localCoords(ev)
      const h = hit(lx, ly)
      pinIdx = h === pinIdx ? -1 : h
      if (ev.pointerType !== "mouse") hoverIdx = -1
      refreshActive()

      if (h >= 0) {
        const cell = state.current.model.cells[h]
        state.current.onCellClick?.({ date: cell.date, count: cell.count })
      }
    }

    const onPointerCancel = () => {
      drag = null
    }

    const onPointerLeave = () => {
      if (!drag) {
        hoverIdx = -1
        refreshActive()
      }
    }

    const onDblClick = () => {
      targetYawOff = 0
      targetElevOff = 0
      kick()
    }

    const onKeyDown = (ev: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Escape", "Enter", " "].includes(ev.key) || !cellCount) return
      ev.preventDefault()

      if (ev.key === "Escape") {
        pinIdx = -1
        hoverIdx = -1
        refreshActive()
        return
      }

      let cur = pinIdx >= 0 ? pinIdx : activeIdx >= 0 ? activeIdx : cellCount - 1
      if (ev.key === "Enter" || ev.key === " ") {
        const cell = state.current.model.cells[cur]
        state.current.onCellClick?.({ date: cell.date, count: cell.count })
        return
      }

      if (pinIdx >= 0 || activeIdx >= 0) {
        if (ev.key === "ArrowLeft") cur -= 7
        if (ev.key === "ArrowRight") cur += 7
        if (ev.key === "ArrowUp") cur -= 1
        if (ev.key === "ArrowDown") cur += 1
        if (ev.key === "Home") cur = 0
        if (ev.key === "End") cur = cellCount - 1
      }
      cur = Math.max(0, Math.min(cellCount - 1, cur))
      pinIdx = cur
      hoverIdx = -1
      refreshActive()
      state.current.setAnnounce(state.current.describe(cur))
    }

    const onBlur = () => {
      pinIdx = -1
      refreshActive()
    }

    const setTarget = () => {
      const tgt = state.current.target
      if (entered && tgt !== targetE) {
        targetE = tgt
        if (tgt === 0) {
          targetYawOff = 0
          targetElevOff = 0
        }
        canvas.style.cursor = state.current.orbit && targetE === 1 ? "grab" : "default"
        kick()
      }
    }

    load()
    retheme()
    relayout()

    const enter = () => {
      if (!entered) {
        entered = true
        if (reducedMotion) e = state.current.target
        setTarget()
      }
    }

    // Trigger enter immediately so 3D skyline renders without waiting
    enter()

    let observer: IntersectionObserver | null = null
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            enter()
            observer?.disconnect()
          }
        },
        { threshold: 0.1 }
      )
      observer.observe(stage)
    }

    const ro = new ResizeObserver(() => {
      if (Math.round(stage.clientWidth) !== stageWidth) relayout()
    })
    ro.observe(stage)

    const mo = new MutationObserver(retheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

    const onMotionChange = () => {
      reducedMotion = motionQuery.matches
      kick()
    }

    motionQuery.addEventListener("change", onMotionChange)
    darkQuery.addEventListener("change", retheme)
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerCancel)
    canvas.addEventListener("pointerleave", onPointerLeave)
    canvas.addEventListener("dblclick", onDblClick)
    canvas.addEventListener("keydown", onKeyDown)
    canvas.addEventListener("blur", onBlur)

    engine.current = {
      kick: () => {
        setTarget()
        kick()
      },
      load: () => {
        load()
        retheme()
        relayout()
      },
      retheme,
      tipWidth: (w: number) => {
        tipW = w
        draw()
      },
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      observer?.disconnect()
      ro.disconnect()
      mo.disconnect()
      motionQuery.removeEventListener("change", onMotionChange)
      darkQuery.removeEventListener("change", retheme)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointercancel", onPointerCancel)
      canvas.removeEventListener("pointerleave", onPointerLeave)
      canvas.removeEventListener("dblclick", onDblClick)
      canvas.removeEventListener("keydown", onKeyDown)
      canvas.removeEventListener("blur", onBlur)
      engine.current = null
    }
  }, [locale])

  React.useEffect(() => {
    engine.current?.kick()
  }, [view, legendLevel])

  React.useEffect(() => {
    engine.current?.load()
  }, [model, heightScale])

  React.useEffect(() => {
    engine.current?.retheme()
  }, [palette])

  React.useLayoutEffect(() => {
    const tip = tipRef.current
    if (tip && active >= 0) {
      engine.current?.tipWidth(tip.offsetWidth)
    }
  }, [active, model])

  const { stats } = model
  const formatRange = (start: string | null, end: string | null, withYear = false) => {
    if (!start || !end) return "—"
    const f = withYear ? ydf : df
    return `${f.format(dayMs(start))} — ${f.format(dayMs(end))}`
  }

  const is3D = view === "3d"
  // Keep stats in the dedicated bottom grid to prevent canvas month labels (like "Apr") from overlapping floating cards
  const showSideStats = false
  const statSize = Math.round(Math.max(30, Math.min(56, width * 0.058)))

  const statsCards = [
    { label: "1 year total", value: nf.format(stats.total), unit: noun(stats.total), sub: formatRange(stats.first, stats.last, true) },
    { label: "Busiest day", value: nf.format(stats.busiest.count), unit: noun(stats.busiest.count), sub: stats.busiest.date ? df.format(dayMs(stats.busiest.date)) : "—" },
    { label: "Longest streak", value: nf.format(stats.longest.days), unit: stats.longest.days === 1 ? "day" : "days", sub: formatRange(stats.longest.start, stats.longest.end) },
    { label: "Current streak", value: nf.format(stats.current.days), unit: stats.current.days === 1 ? "day" : "days", sub: formatRange(stats.current.start, stats.current.end) },
  ]

  const showBottomStats = showStats
  const ease = "cubic-bezier(0.65, 0, 0.35, 1)"
  const legendLabels = ["No " + plural, "Light", "Moderate", "Heavy", "Heaviest"]
  const hints = ["Hover a day for details · arrow keys to explore", "Drag to orbit · double-click to reset"]
  const currentHint = hints[is3D && orbit ? 1 : 0]

  return (
    <section
      ref={rootRef}
      className={`relative w-full rounded-xl border p-4 font-sans sm:p-5 ${className}`}
      style={{
        background: "var(--color-background, #ffffff)",
        color: "var(--color-foreground, #171717)",
        borderColor: "var(--color-border, #e5e5e5)",
      }}
    >
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="m-0 text-[15px] font-normal leading-snug">
          {title ?? (
            <>
              <span className="font-semibold tabular-nums">{nf.format(stats.total)}</span>{" "}
              {noun(stats.total)} in the last year
            </>
          )}
        </h3>

        {showToggle && (
          <div
            role="group"
            aria-label="Chart view"
            className="relative inline-flex rounded-md border p-0.5"
            style={{ borderColor: "var(--color-border, #e5e5e5)" }}
          >
            <span
              aria-hidden="true"
              className="absolute top-0.5 bottom-0.5 left-0.5 w-8 rounded transition-transform duration-500 motion-reduce:transition-none"
              style={{
                background: "var(--color-foreground, #171717)",
                transform: is3D ? "translateX(100%)" : "translateX(0)",
                transitionTimingFunction: ease,
              }}
            />
            {( ["2d", "3d"] as const ).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                aria-label={v === "2d" ? "Flat heat map" : "3D skyline"}
                title={v === "2d" ? "Flat heat map" : "3D skyline"}
                onClick={() => setView(v)}
                className="relative z-10 grid h-7 w-8 cursor-pointer place-items-center rounded border-0 bg-transparent p-0 transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                style={{
                  color: view === v ? "var(--color-background, #ffffff)" : MUTED,
                  outlineColor: "var(--color-foreground, #171717)",
                }}
              >
                {v === "2d" ? <GridIcon /> : <CubeIcon />}
              </button>
            ))}
          </div>
        )}
      </header>

      <div
        className="relative rounded-lg border"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
          <div
            ref={stageRef}
            className="relative w-full overflow-hidden rounded-md outline-offset-4 has-[:focus-visible]:outline-2"
            style={{ height: 240, minHeight: 180, outlineColor: "rgba(255, 255, 255, 0.2)" }}
          >
            <canvas
              ref={canvasRef}
              tabIndex={0}
              role="img"
              aria-label={`${nf.format(stats.total)} ${noun(stats.total)} between ${formatRange(stats.first, stats.last, true)}, shown as a ${is3D ? "3D skyline" : "heat map"}. Use the arrow keys to read individual days.`}
              className="absolute top-0 left-0 block outline-none"
              style={{ maxWidth: "none", touchAction: is3D && orbit ? "pan-y" : "auto" }}
            />

            {showStats && showSideStats && (
              <>
                <div
                  aria-hidden={!is3D}
                  className="pointer-events-none absolute top-1 right-1 flex flex-col items-end gap-5 transition-[opacity,transform] motion-reduce:transition-none"
                  style={{
                    opacity: is3D ? 1 : 0,
                    transform: is3D ? "translateY(0)" : "translateY(-10px)",
                    transitionDuration: is3D ? "600ms" : "300ms",
                    transitionDelay: is3D ? `${Math.round(duration * 0.55)}ms` : "0ms",
                    transitionTimingFunction: ease,
                  }}
                >
                  <Stat {...statsCards[0]} accent={theme.accent} size={statSize} align="end" />
                  <Stat {...statsCards[1]} accent={theme.accent} size={statSize} align="end" />
                </div>
                <div
                  aria-hidden={!is3D}
                  className="pointer-events-none absolute bottom-1 left-1 flex flex-col items-start gap-5 transition-[opacity,transform] motion-reduce:transition-none"
                  style={{
                    opacity: is3D ? 1 : 0,
                    transform: is3D ? "translateY(0)" : "translateY(10px)",
                    transitionDuration: is3D ? "600ms" : "300ms",
                    transitionDelay: is3D ? `${Math.round(duration * 0.65)}ms` : "0ms",
                    transitionTimingFunction: ease,
                  }}
                >
                  <Stat {...statsCards[2]} accent={theme.accent} size={statSize} align="start" />
                  <Stat {...statsCards[3]} accent={theme.accent} size={statSize} align="start" />
                </div>
              </>
            )}
          </div>

          <div
            ref={tipRef}
            role="tooltip"
            aria-hidden={active < 0}
            className="pointer-events-none absolute top-3 left-3 z-20 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12px] leading-none shadow-lg transition-opacity duration-150 sm:top-4 sm:left-4 motion-reduce:transition-none"
            style={{
              opacity: active >= 0 ? 1 : 0,
              background: "var(--color-foreground, #171717)",
              color: "var(--color-background, #ffffff)",
            }}
          >
            {active >= 0 && model.cells[active] ? (
              <>
                <strong className="font-semibold">
                  {model.cells[active].count
                    ? `${nf.format(model.cells[active].count)} ${noun(model.cells[active].count)}`
                    : `No ${plural}`}
                </strong>
                <span className="opacity-75">
                  {" on "}
                  {ydf.format(dayMs(model.cells[active].date))}
                </span>
              </>
            ) : (
              "\u00A0"
            )}
            <span
              aria-hidden="true"
              className="absolute top-full h-0 w-0"
              style={{
                left: "var(--arrow, 50%)",
                marginLeft: -5,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid var(--color-foreground, #171717)",
              }}
            />
          </div>
        </div>

        {showStats && (
          <div
            aria-hidden={!showBottomStats}
            className="grid transition-[grid-template-rows,opacity] motion-reduce:transition-none border-t border-white/5"
            style={{
              gridTemplateRows: showBottomStats ? "1fr" : "0fr",
              opacity: showBottomStats ? 1 : 0,
              transitionDuration: `${duration}ms`,
              transitionTimingFunction: ease,
            }}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-3 pt-4 pb-1 sm:px-4 md:grid-cols-4">
                {statsCards.map((s) => (
                  <Stat key={s.label} {...s} accent={theme.accent} size={28} align="stack" />
                ))}
              </div>
            </div>
          </div>
        )}

        <div
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 pt-3 pb-3 text-[12px] sm:px-4"
          style={{ color: MUTED }}
        >
          {footer === undefined ? (
            <span className="relative grid flex-1">
              {hints.map((h) => (
                <span
                  key={h}
                  aria-hidden={h !== currentHint}
                  className="[grid-area:1/1] transition-opacity duration-500 motion-reduce:transition-none"
                  style={{ opacity: h === currentHint ? 1 : 0 }}
                >
                  {h}
                </span>
              ))}
            </span>
          ) : (
            <span className="flex-1">{footer}</span>
          )}

          {showLegend && (
            <div
              className="flex items-center gap-1.5"
              onMouseLeave={() => setLegendLevel(-1)}
            >
              <span className="mr-0.5">Less</span>
              {theme.swatches.map((swatch, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Highlight ${legendLabels[idx].toLowerCase()} days`}
                  aria-pressed={legendLevel === idx}
                  title={legendLabels[idx]}
                  onMouseEnter={() => setLegendLevel(idx)}
                  onFocus={() => setLegendLevel(idx)}
                  onBlur={() => setLegendLevel(-1)}
                  onClick={() => setLegendLevel((prev) => (prev === idx ? -1 : idx))}
                  className="h-[11px] w-[11px] cursor-pointer rounded-[2px] border-0 p-0 transition-[background-color,transform] duration-500 hover:scale-125 focus-visible:outline-2 focus-visible:outline-offset-1 motion-reduce:transition-none"
                  style={{
                    background: swatch,
                    outlineColor: "var(--color-foreground, #171717)",
                    boxShadow: "inset 0 0 0 1px rgba(127,127,127,0.12)",
                  }}
                />
              ))}
              <span className="ml-0.5">More</span>
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </section>
  )
}
