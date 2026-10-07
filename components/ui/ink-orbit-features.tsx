"use client"

// The features section from ink-orbit-saas-template, standalone: a hatched
// page and a bento of three live diagrams — your team's edits flowing through a
// hub into a stack of reports that keeps printing, an integrations hub that
// syncs one tool at a time, and a forecast chart you can scrub.
//
// No dependencies, no assets. React is the only import.

import React from "react"

export type InkFeatureCopy = { title: string; description: string }
export type InkFeatures = {
  tag: string
  /** `*word*` sets a word in the muted tone; `\n` breaks the line. */
  title: string
  collaboration: InkFeatureCopy
  reports: InkFeatureCopy
  integrations: InkFeatureCopy & { tools: string[] }
  insights: InkFeatureCopy & { values: number[]; forecastFrom: number }
}

export type InkOrbitFeaturesProps = {
  /** `auto` follows prefers-color-scheme. */
  theme?: "light" | "dark" | "auto"
  /** Shown on the hub chip in the flow diagram (first word, uppercased). */
  brand?: string
  tag?: string
  title?: string
  collaboration?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  reports?: { [K in keyof InkFeatureCopy]?: InkFeatureCopy[K] }
  integrations?: { [K in keyof InkFeatures["integrations"]]?: InkFeatures["integrations"][K] }
  insights?: { [K in keyof InkFeatures["insights"]]?: InkFeatures["insights"][K] }
  className?: string
  style?: React.CSSProperties
}

/* ------------------------------------------------------------------ logic */

// #region logic
function clamp(v: number, a: number, b: number): number {
  return Math.min(b, Math.max(a, v))
}

// Smooth line + closed area through values, inside a w×h box.
function chartPaths(values: number[], w: number, h: number, pad: number) {
  const n = values.length
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [
    pad + (n < 2 ? 0 : (i / (n - 1)) * (w - pad * 2)),
    h - pad - ((v - lo) / span) * (h - pad * 2),
  ] as [number, number])
  let line = ""
  pts.forEach(([x, y], i) => {
    if (i === 0) {
      line = "M" + x.toFixed(1) + "," + y.toFixed(1)
      return
    }
    const [px, py] = pts[i - 1]
    const cx = (px + x) / 2
    line +=
      " C" +
      cx.toFixed(1) +
      "," +
      py.toFixed(1) +
      " " +
      cx.toFixed(1) +
      "," +
      y.toFixed(1) +
      " " +
      x.toFixed(1) +
      "," +
      y.toFixed(1)
  })
  const area = n
    ? line +
      " L" +
      pts[n - 1][0].toFixed(1) +
      "," +
      (h - pad) +
      " L" +
      pts[0][0].toFixed(1) +
      "," +
      (h - pad) +
      " Z"
    : ""
  return { line, area, points: pts }
}

function nearestIndex(xs: number[], x: number): number {
  let best = 0
  for (let i = 1; i < xs.length; i++) if (Math.abs(xs[i] - x) < Math.abs(xs[best] - x)) best = i
  return best
}

// "Smart *Workflow*\nAutomation" → lines of { text, muted } runs.
function parseTitle(s: string): { text: string; muted: boolean }[][] {
  return s.split(/\n|\\n/).map((line) => {
    const out: { text: string; muted: boolean }[] = []
    line.split("*").forEach((text, i) => {
      if (text) out.push({ text, muted: i % 2 === 1 })
    })
    return out
  })
}
// #endregion logic

/* --------------------------------------------------------------- defaults */

const D_FEATURES: InkFeatures = {
  tag: "Features",
  title: "Smart *Workflow*\nAutomation",
  collaboration: {
    title: "Real-Time Collaboration",
    description:
      "Work together in real time, share updates, track changes, and stay aligned without switching tools.",
  },
  reports: {
    title: "Auto-generated reports",
    description:
      "Get clean, structured reports generated from your data — no formatting, manual writing, or editing required.",
  },
  integrations: {
    title: "Integrations Hub",
    description:
      "Connect all your tools — Slack, Google Workspace, CRMs, databases — into one unified AI system.",
    tools: ["Sheets", "Drive", "Docs", "Search"],
  },
  insights: {
    title: "Predictive Insights",
    description:
      "AI analyzes your data and delivers real-time predictions you can act on immediately.",
    values: [22, 26, 24, 31, 29, 36, 34, 41, 39, 47, 52, 58],
    forecastFrom: 8,
  },
}

function useInView(threshold = 0.2): [React.RefObject<HTMLDivElement | null>, boolean] {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = React.useState(false)

  React.useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    if (typeof IntersectionObserver !== "function") {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, threshold])

  return [ref, inView]
}

function CornerBrackets() {
  return (
    <>
      <span className="ib-c ib-c-tl" aria-hidden="true" />
      <span className="ib-c ib-c-tr" aria-hidden="true" />
      <span className="ib-c ib-c-bl" aria-hidden="true" />
      <span className="ib-c ib-c-br" aria-hidden="true" />
    </>
  )
}

function Title({
  text,
  className = "ib-h2",
  as: Component = "h2",
}: {
  text: string
  className?: string
  as?: React.ElementType
}) {
  const Tag = Component as React.ElementType<{ className?: string; children?: React.ReactNode }>
  return (
    <Tag className={className}>
      {parseTitle(text).map((line, lineIdx) => (
        <span key={lineIdx}>
          {line.map((part, partIdx) => (
            <React.Fragment key={partIdx}>
              {part.muted ? (
                <span className="ib-muted" style={{ display: "inline" }}>
                  {part.text}
                </span>
              ) : (
                part.text
              )}
            </React.Fragment>
          ))}
        </span>
      ))}
    </Tag>
  )
}

function Mark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 21V3h4.2l9.6 12.2V3H21v18h-4.2L7.2 8.8V21z"
        fill="currentColor"
      />
    </svg>
  )
}

function ServiceNodeIcon({
  index,
  size = 22,
}: {
  index: number
  size?: number
  uid?: string
}) {
  const glyph = index % 5
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#D97757"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="bg-[#101018] p-1 rounded-full"
      aria-hidden="true"
    >
      {glyph === 0 && (
        <>
          <rect x="2" y="3" width="20" height="5" rx="1" />
          <rect x="2" y="10" width="20" height="5" rx="1" />
          <rect x="2" y="17" width="20" height="5" rx="1" />
          <circle cx="6" cy="5.5" r="0.75" fill="#D97757" />
          <circle cx="6" cy="12.5" r="0.75" fill="#D97757" />
          <circle cx="6" cy="19.5" r="0.75" fill="#D97757" />
        </>
      )}
      {glyph === 1 && (
        <>
          <ellipse cx="12" cy="5" rx="8" ry="2.5" />
          <path d="M20 12c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5" />
          <path d="M4 5v14c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5" />
        </>
      )}
      {glyph === 2 && (
        <>
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" />
        </>
      )}
      {glyph === 3 && (
        <>
          <circle cx="12" cy="6" r="3" />
          <circle cx="6" cy="18" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8 16l3-7M16 16l-3-7M8 18h8" />
        </>
      )}
      {glyph === 4 && (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 9l4 3-4 3M13 15h4" />
        </>
      )}
    </svg>
  )
}

function ToolGlyph({ index }: { index: number }) {
  const glyph = index % 4
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      {glyph === 0 && (
        <>
          <rect x="-6" y="-6" width="12" height="12" rx="1.5" />
          <path d="M-6 -2h12M-6 2h12M-1.5 -6v12" />
        </>
      )}
      {glyph === 1 && <path d="M-6.5 4 -2 -5h4l4.5 9zm2.4 0h9.2M-2 -5l4.5 9" />}
      {glyph === 2 && (
        <>
          <path d="M-4.5 -6.5h6l3 3v10h-9z" />
          <path d="M-2 0h4.5M-2 3h4.5" />
        </>
      )}
      {glyph === 3 && (
        <>
          <circle cx="-1" cy="-1" r="4.5" />
          <path d="M2.4 2.4 6 6" />
        </>
      )}
    </g>
  )
}

function FlowCard({
  brand,
  features,
  uid,
  reduced,
  inView,
}: {
  brand: string
  features: InkFeatures
  uid: string
  reduced: boolean
  inView: boolean
}) {
  const [reportNum, setReportNum] = React.useState(128)
  const [hoverSide, setHoverSide] = React.useState<"" | "left" | "right">("")

  React.useEffect(() => {
    if (reduced || !inView) return
    const timer = setInterval(() => setReportNum((n) => n + 1), 2800)
    return () => clearInterval(timer)
  }, [reduced, inView])

  const team = [
    { x: 58, y: 38, name: "edge-worker-01 · 12ms" },
    { x: 104, y: 22, name: "redis-cluster · hot" },
    { x: 150, y: 40, name: "stream-pipeline · active" },
    { x: 46, y: 92, name: "postgres-replica · sync" },
    { x: 146, y: 114, name: "inference-node · ready" },
  ]
  const pathLeftTop = "M117,67 C196,67 210,100 262,100"
  const pathLeftBottom = "M117,73 C186,73 206,120 262,120"
  const pathRightTop = "M378,100 C412,100 418,86 450,86"
  const pathRightBottom = "M378,120 C412,120 418,134 450,134"

  const brandFirst = brand.split(" ")[0].toUpperCase()
  const brandIsLong = brandFirst.length * 6.7 > 58
  const raysId = uid + "rays"
  const glowId = uid + "glow"

  return (
    <div className="ib-frame ib-frame-hover ib-wide">
      <CornerBrackets />
      <div className="ib-card" style={{ padding: 0, overflow: "hidden" }}>
        <svg
          className="ib-diagram"
          viewBox="0 0 640 178"
          role="img"
          aria-label={`Your team's edits flow through ${brand} into finished reports`}
        >
          <defs>
            <radialGradient id={glowId} cx="320" cy="110" r="190" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--ib-raise)" stopOpacity="1" />
              <stop offset="1" stopColor="var(--ib-raise)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={raysId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-line-strong)" stopOpacity=".55" />
              <stop offset="1" stopColor="var(--ib-line-strong)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="640" height="178" fill={`url(#${glowId})`} />
          {[-62, -38, -14, 14, 38, 62].map((angle, i) => (
            <path
              key={i}
              d={`M320,110 L${320 + Math.sin((angle * Math.PI) / 180) * 260},${
                110 - Math.cos((angle * Math.PI) / 180) * 260
              } L${320 + Math.sin(((angle + 7) * Math.PI) / 180) * 260},${
                110 - Math.cos(((angle + 7) * Math.PI) / 180) * 260
              }Z`}
              fill={`url(#${raysId})`}
              opacity=".5"
            />
          ))}

          {/* Left: Team Nodes */}
          <g onMouseEnter={() => setHoverSide("left")} onMouseLeave={() => setHoverSide("")}>
            <rect x="20" y="8" width="170" height="130" fill="transparent" />
            {team.map((member, i) => (
              <line
                key={`l${i}`}
                x1={member.x}
                y1={member.y}
                x2="104"
                y2="70"
                stroke="var(--ib-line-strong)"
                strokeDasharray="2 3"
              />
            ))}
            <g transform="translate(91,57)">
              <rect width="26" height="26" rx="5" className="ib-node" />
              <g transform="translate(5,5)" style={{ color: "var(--ib-ink)" }}>
                <Mark size={16} />
              </g>
            </g>
            {team.map((member, i) => (
              <g key={i} className="ib-av" tabIndex={0} role="img" aria-label={member.name}>
                <svg
                  x={member.x - 11}
                  y={member.y - 11}
                  width="22"
                  height="22"
                  viewBox="0 0 22 22"
                  overflow="visible"
                >
                  <clipPath id={`${uid}avc${i}`}>
                    <circle cx="11" cy="11" r="11" />
                  </clipPath>
                  <g clipPath={`url(#${uid}avc${i})`}>
                    <ServiceNodeIcon index={i} size={22} uid={`${uid}f`} />
                  </g>
                  <circle cx="11" cy="11" r="10.5" fill="none" stroke="var(--ib-paper)" strokeWidth="1.5" />
                </svg>
                <circle
                  cx={member.x + 8}
                  cy={member.y + 8}
                  r="2.6"
                  fill={i === 4 ? "var(--ib-faint)" : "#22c55e"}
                  stroke="var(--ib-paper)"
                  className={i === 4 ? undefined : "ib-presence"}
                />
                <g className="ib-av-tip" transform={`translate(${member.x},${member.y - 18})`}>
                  <rect
                    x={-member.name.length * 2.45 - 6}
                    y="-9"
                    width={member.name.length * 4.9 + 12}
                    height="14"
                    rx="2"
                    fill="var(--ib-inv)"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fontSize="7.5"
                    fill="var(--ib-inv-ink)"
                    fontFamily="var(--ib-sans)"
                  >
                    {member.name}
                  </text>
                </g>
              </g>
            ))}
          </g>

          {/* Flow lines */}
          {[pathLeftTop, pathLeftBottom].map((d, i) => (
            <path
              key={d}
              d={d}
              className={`ib-flow${hoverSide === "left" ? " ib-flow-on" : ""}${i ? " ib-dash" : ""}`}
            />
          ))}
          {[pathRightTop, pathRightBottom].map((d, i) => (
            <path
              key={d}
              d={d}
              className={`ib-flow${hoverSide === "right" ? " ib-flow-on" : ""}${i ? " ib-dash" : ""}`}
            />
          ))}

          {/* Animated packets */}
          {!reduced &&
            [pathLeftTop, pathLeftBottom, pathRightTop, pathRightBottom].map((p, i) => (
              <circle key={`p${i}`} r="2.2" className="ib-pkt">
                <animateMotion
                  dur={`${2.2 + (i % 2) * 0.6}s`}
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                  path={p}
                />
              </circle>
            ))}

          {/* Center Hub */}
          <g transform="translate(262,88)">
            <rect
              x="-4"
              y="-4"
              width="124"
              height="52"
              rx="8"
              fill="none"
              stroke="var(--ib-line)"
              className={reduced ? undefined : "ib-glow"}
            />
            <rect
              width="116"
              height="44"
              rx="6"
              className="ib-node"
              style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,.08))" }}
            />
            <g transform="translate(13,14)" style={{ color: "var(--ib-ink)" }}>
              <Mark size={16} />
            </g>
            <text
              x="36"
              y="26"
              fontSize="8.5"
              letterSpacing="1.4"
              fontWeight="600"
              fill="var(--ib-soft)"
              fontFamily="var(--ib-sans)"
              textLength={brandIsLong ? 58 : undefined}
              lengthAdjust={brandIsLong ? "spacingAndGlyphs" : undefined}
            >
              {brandFirst}
            </text>
            <path d="M100 18l4 4-4 4" fill="none" stroke="var(--ib-muted)" strokeWidth="1.3" />
          </g>

          {/* Right: Printing sheets */}
          <g onMouseEnter={() => setHoverSide("right")} onMouseLeave={() => setHoverSide("")}>
            {[2, 1, 0].map((offset) => (
              <g
                key={reportNum - offset}
                transform={`translate(${450 + offset * 12},${40 - offset * 10})`}
                opacity={1 - offset * 0.25}
              >
                <g className={`ib-sheet${offset === 0 ? " ib-sheet-new" : ""}`}>
                  <rect width="138" height="102" rx="3" fill="var(--ib-raise)" stroke="var(--ib-line-strong)" />
                  {offset === 0 && (
                    <>
                      <text x="10" y="16" fontSize="7" fill="var(--ib-muted)" fontFamily="var(--ib-mono)">
                        {`BUILD #${reportNum}`}
                      </text>
                      <rect x="10" y="24" width="64" height="5" rx="1" fill="var(--ib-ink)" opacity=".75" />
                      <rect x="10" y="33" width="92" height="3" rx="1" fill="var(--ib-line-strong)" />
                      <rect x="10" y="39" width="80" height="3" rx="1" fill="var(--ib-line-strong)" />
                      {[18, 26, 14, 30, 22, 34].map((h, bi) => (
                        <rect
                          key={bi}
                          x={12 + bi * 13}
                          y={92 - h}
                          width="8"
                          height={h}
                          fill="var(--ib-ink)"
                          opacity={0.25 + bi * 0.12}
                        />
                      ))}
                      <path d="M92 64h34M92 72h28M92 80h32" stroke="var(--ib-line-strong)" strokeWidth="2.5" />
                    </>
                  )}
                </g>
              </g>
            ))}
          </g>
        </svg>

        <div className="ib-wide-copy" style={{ padding: "0 22px 20px" }}>
          <div>
            <h3>{features.collaboration.title}</h3>
            <p>{features.collaboration.description}</p>
          </div>
          <div>
            <h3>{features.reports.title}</h3>
            <p>{features.reports.description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationsCard({
  copy,
  reduced,
}: {
  copy: InkFeatures["integrations"]
  reduced: boolean
}) {
  const [activeTool, setActiveTool] = React.useState<number>(-1)
  const [cycleIndex, setCycleIndex] = React.useState(0)

  React.useEffect(() => {
    if (reduced || activeTool >= 0) return
    const timer = setInterval(() => setCycleIndex((idx) => (idx + 1) % 4), 1700)
    return () => clearInterval(timer)
  }, [reduced, activeTool])

  const selected = activeTool >= 0 ? activeTool : reduced ? -1 : cycleIndex
  const toolsPos = [
    { x: 66, y: 34 },
    { x: 66, y: 116 },
    { x: 234, y: 34 },
    { x: 234, y: 116 },
  ]

  const getPath = (i: number) => {
    const pt = toolsPos[i]
    const dir = pt.x < 150 ? -1 : 1
    return `M${150 + dir * 17},75 H${150 + dir * 42} V${pt.y} H${pt.x - dir * 15}`
  }

  return (
    <div className="ib-frame ib-frame-hover">
      <CornerBrackets />
      <div className="ib-card">
        <svg className="ib-diagram" viewBox="0 0 300 150" role="group" aria-label="Integrations">
          {toolsPos.map((_, i) => (
            <path
              key={i}
              d={getPath(i)}
              className={`ib-flow${selected === i ? " ib-flow-on" : ""}`}
            />
          ))}
          {!reduced && selected >= 0 && (
            <circle key={selected} r="2.2" className="ib-pkt">
              <animateMotion dur="1.1s" repeatCount="indefinite" path={getPath(selected)} />
            </circle>
          )}

          {/* Center Node */}
          <g transform="translate(133,58)">
            <rect
              width="34"
              height="34"
              rx="7"
              className="ib-node"
              style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.08))" }}
            />
            <g transform="translate(8,8)" style={{ color: "var(--ib-ink)" }}>
              <Mark size={18} />
            </g>
          </g>

          {/* Tools */}
          {toolsPos.map((pt, i) => (
            <g
              key={i}
              className={`ib-tool${selected === i ? " ib-tool-on" : ""}`}
              tabIndex={0}
              role="img"
              aria-label={copy.tools[i] ?? "Tool"}
              onMouseEnter={() => setActiveTool(i)}
              onMouseLeave={() => setActiveTool(-1)}
              onFocus={() => setActiveTool(i)}
              onBlur={() => setActiveTool(-1)}
            >
              <rect x={pt.x - 15} y={pt.y - 15} width="30" height="30" rx="6" className="ib-node" />
              <g transform={`translate(${pt.x},${pt.y})`} style={{ color: "var(--ib-ink)" }}>
                <ToolGlyph index={i} />
              </g>
              <text
                x={pt.x}
                y={pt.y + (pt.y < 75 ? -21 : 28)}
                textAnchor="middle"
                fontSize="8"
                fill="var(--ib-muted)"
                fontFamily="var(--ib-sans)"
                opacity={selected === i ? 1 : 0}
                style={{ transition: "opacity .25s" }}
              >
                {copy.tools[i] ?? ""}
              </text>
            </g>
          ))}

          <text
            x="150"
            y="112"
            textAnchor="middle"
            fontSize="7"
            fill="var(--ib-faint)"
            fontFamily="var(--ib-mono)"
          >
            {selected >= 0 ? `syncing · ${(copy.tools[selected] ?? "").toLowerCase()}` : "4 connected"}
          </text>
        </svg>

        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}

function InsightsCard({
  copy,
  uid,
  reduced,
}: {
  copy: InkFeatures["insights"]
  uid: string
  reduced: boolean
}) {
  const [ref, inView] = useInView(0.3)
  const [hoverIndex, setHoverIndex] = React.useState<number>(-1)

  const w = 300
  const h = 130
  const values = copy.values.length > 1 ? copy.values : [1, 2]
  const { line, area, points } = chartPaths(values, w, h, 14)
  const forecastIdx = clamp(copy.forecastFrom, 1, values.length - 1)
  const areaGradId = uid + "area"
  const lastPoint = points[points.length - 1]
  const activeIdx = hoverIndex >= 0 ? hoverIndex : points.length - 1
  const activePoint = points[activeIdx]
  const pctChange = Math.round(((values[activeIdx] - values[0]) / (values[0] || 1)) * 100)

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * w
    setHoverIndex(nearestIndex(points.map((p) => p[0]), x))
  }

  return (
    <div className="ib-frame ib-frame-hover" ref={ref} data-in={inView}>
      <CornerBrackets />
      <div className="ib-card">
        <svg
          className="ib-diagram ib-chart"
          viewBox={`0 0 ${w} ${h + 6}`}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setHoverIndex(-1)}
          role="img"
          aria-label={`${copy.title} chart`}
        >
          <defs>
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--ib-ink)" stopOpacity=".12" />
              <stop offset="1" stopColor="var(--ib-ink)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((lvl) => (
            <line
              key={lvl}
              x1="14"
              x2={w - 14}
              y1={h * lvl}
              y2={h * lvl}
              stroke="var(--ib-line)"
            />
          ))}

          <path d={area} fill={`url(#${areaGradId})`} />
          <path
            d={line}
            fill="none"
            stroke="var(--ib-ink)"
            strokeWidth="1.4"
            pathLength={1}
            className="ib-line-draw"
            opacity=".85"
          />

          <line
            x1={points[forecastIdx][0]}
            x2={points[forecastIdx][0]}
            y1="10"
            y2={h - 14}
            stroke="var(--ib-line-strong)"
            strokeDasharray="2 3"
          />
          <text
            x={points[forecastIdx][0] - 4}
            y={h - 18}
            textAnchor="end"
            fontSize="7"
            fill="var(--ib-faint)"
            fontFamily="var(--ib-mono)"
          >
            FORECAST
          </text>

          {hoverIndex >= 0 && (
            <line
              x1={activePoint[0]}
              x2={activePoint[0]}
              y1="8"
              y2={h - 14}
              stroke="var(--ib-ink)"
              strokeOpacity=".35"
            />
          )}

          {!reduced && hoverIndex < 0 && (
            <circle
              cx={lastPoint[0]}
              cy={lastPoint[1]}
              r="7"
              fill="var(--ib-ink)"
              opacity=".15"
              className="ib-glow"
            />
          )}

          <circle
            cx={activePoint[0]}
            cy={activePoint[1]}
            r="3.2"
            fill="var(--ib-raise)"
            stroke="var(--ib-ink)"
            strokeWidth="1.5"
          />

          <g
            transform={`translate(${clamp(activePoint[0], 40, w - 40)},${
              activePoint[1] < 34 ? activePoint[1] + 22 : activePoint[1] - 12
            })`}
          >
            <rect x="-30" y="-11" width="60" height="15" rx="2" fill="var(--ib-inv)" />
            <text
              x="0"
              y="-1"
              textAnchor="middle"
              fontSize="7.5"
              fill="var(--ib-inv-ink)"
              fontFamily="var(--ib-mono)"
            >
              {(activeIdx >= forecastIdx ? "pred " : `wk ${activeIdx + 1} `) +
                (pctChange >= 0 ? "+" : "") +
                pctChange +
                "%"}
            </text>
          </g>
        </svg>

        <div style={{ marginTop: "auto" }}>
          <h3>{copy.title}</h3>
          <p>{copy.description}</p>
        </div>
      </div>
    </div>
  )
}

const IB_CSS = `
.ib-root{--ib-page:#efefef;--ib-hatch:rgba(0,0,0,.06);--ib-paper:#fbfbfb;--ib-card:#f4f4f4;--ib-raise:#ffffff;--ib-ink:#151515;--ib-soft:#3d3d3d;--ib-muted:#7b7b7b;--ib-faint:#a8a8a8;--ib-line:#e2e2e2;--ib-line-strong:#cfcfcf;--ib-bracket:#c9c9c9;--ib-inv:#161616;--ib-inv-ink:#f5f5f5;--ib-shadow:0 1px 2px rgba(0,0,0,.05),0 8px 24px -12px rgba(0,0,0,.12);--ib-sans:"Manrope","Inter",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--ib-mono:"JetBrains Mono",ui-monospace,"SF Mono",Menlo,Consolas,monospace;position:relative;width:100%;box-sizing:border-box;background-color:transparent;background-image:repeating-linear-gradient(135deg,var(--ib-hatch) 0 1px,transparent 1px 10px);color:var(--ib-ink);font-family:var(--ib-sans);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased;padding:28px clamp(10px,2.4vw,28px);transition:background-color .45s ease,color .45s ease}
.ib-root[data-theme="dark"]{--ib-page:transparent;--ib-hatch:rgba(255,255,255,.04);--ib-paper:#0a0a0e;--ib-card:#101015;--ib-raise:#16161d;--ib-ink:#EDE8DF;--ib-soft:#c9c5bd;--ib-muted:#8d8a83;--ib-faint:#5d5a55;--ib-line:rgba(255,255,255,.08);--ib-line-strong:rgba(255,255,255,.16);--ib-bracket:rgba(217,119,87,.4);--ib-inv:#EDE8DF;--ib-inv-ink:#08080B;--ib-shadow:0 1px 2px rgba(0,0,0,.4),0 10px 30px -14px rgba(0,0,0,.7)}
.ib-root :where(*){box-sizing:border-box}
.ib-root :focus-visible{outline:2px solid var(--ib-ink);outline-offset:2px}
.ib-root :where(svg){display:block;max-width:none;flex:none}
.ib-root :where(h2,h3,p){margin:0;padding:0;font-size:inherit;font-weight:inherit}
.ib-shell{width:100%;max-width:1180px;margin:0 auto;container-type:inline-size}
.ib-sec{position:relative;background:var(--ib-paper);border:1px solid var(--ib-line);border-radius:1rem;padding:clamp(36px,6cqw,72px) clamp(16px,4cqw,48px);transition:background-color .45s,border-color .45s}
.ib-reveal{opacity:0;transform:translateY(18px);transition:opacity .8s cubic-bezier(.2,.7,.2,1),transform .8s cubic-bezier(.2,.7,.2,1)}
.ib-reveal[data-in="true"]{opacity:1;transform:none}
.ib-head{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;margin-bottom:clamp(28px,4.5cqw,52px)}
.ib-tag{display:inline-block;padding:4px 10px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#D97757;background:rgba(217,119,87,0.08);border:1px solid rgba(217,119,87,0.2);border-radius:4px;font-family:var(--ib-mono)}
.ib-h2{font-size:clamp(28px,4.4cqw,44px);line-height:1.15;letter-spacing:-.025em;font-weight:500;font-family:var(--font-serif, "Playfair Display", Georgia, serif)}
.ib-h2>span{display:block}
.ib-muted{color:var(--ib-faint)}
.ib-frame{position:relative}
.ib-c{position:absolute;width:12px;height:12px;border-color:var(--ib-bracket);border-style:solid;border-width:0;pointer-events:none;transition:border-color .3s,transform .35s cubic-bezier(.2,.8,.2,1)}
.ib-c-tl{top:-6px;left:-6px;border-top-width:1.5px;border-left-width:1.5px}
.ib-c-tr{top:-6px;right:-6px;border-top-width:1.5px;border-right-width:1.5px}
.ib-c-bl{bottom:-6px;left:-6px;border-bottom-width:1.5px;border-left-width:1.5px}
.ib-c-br{bottom:-6px;right:-6px;border-bottom-width:1.5px;border-right-width:1.5px}
.ib-frame-hover:hover>.ib-c{border-color:#D97757}
.ib-frame-hover:hover>.ib-c-tl{transform:translate(-3px,-3px)}
.ib-frame-hover:hover>.ib-c-tr{transform:translate(3px,-3px)}
.ib-frame-hover:hover>.ib-c-bl{transform:translate(-3px,3px)}
.ib-frame-hover:hover>.ib-c-br{transform:translate(3px,3px)}
.ib-bento{display:grid;grid-template-columns:minmax(0,1fr);gap:clamp(22px,3cqw,34px)}
@container (min-width:720px){.ib-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.ib-wide{grid-column:1 / -1;width:min(100%,820px);justify-self:center}}
.ib-card{background:linear-gradient(180deg,var(--ib-raise),var(--ib-card));border:1px solid var(--ib-line);border-radius:12px;padding:clamp(14px,2cqw,22px);display:flex;flex-direction:column;gap:14px;transition:border-color .3s,box-shadow .35s,background-color .45s}
.ib-card:hover{border-color:var(--ib-line-strong);box-shadow:var(--ib-shadow)}
.ib-card h3{font-size:14px;font-weight:600;letter-spacing:-.005em;color:var(--ib-ink)}
.ib-card p{font-size:12.5px;line-height:1.55;color:var(--ib-muted);max-width:40ch}
.ib-diagram{width:100%;height:auto;overflow:visible}
.ib-wide-copy{display:grid;grid-template-columns:1fr;gap:16px}
@container (min-width:560px){.ib-wide-copy{grid-template-columns:1fr 1fr}.ib-wide-copy>div:last-child{justify-self:end;text-align:left}}
.ib-flow{stroke:var(--ib-line-strong);fill:none;stroke-width:1.2;transition:stroke .3s}
.ib-flow-on{stroke:var(--ib-ink)}
.ib-dash{stroke-dasharray:3 4;animation:ib-dash 1.2s linear infinite}
.ib-pkt{fill:#D97757}
.ib-node{fill:var(--ib-raise);stroke:var(--ib-line-strong);transition:stroke .3s,transform .3s}
.ib-av{cursor:pointer;transition:transform .35s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-av:hover,.ib-av:focus-visible{transform:scale(1.18)}
.ib-av-tip{opacity:0;transition:opacity .2s;pointer-events:none}
.ib-av:hover .ib-av-tip,.ib-av:focus .ib-av-tip{opacity:1}
.ib-presence{animation:ib-pulse 2.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.ib-sheet{transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .7s}
.ib-sheet-new{animation:ib-sheet-in .7s cubic-bezier(.2,.8,.2,1) both}
.ib-tool{cursor:pointer;transition:transform .3s cubic-bezier(.2,.8,.2,1);transform-box:fill-box;transform-origin:center}
.ib-tool:hover,.ib-tool-on{transform:translateY(-2px)}
.ib-tool rect{transition:stroke .3s}
.ib-tool-on rect.ib-node{stroke:#D97757}
.ib-chart{cursor:crosshair}
.ib-line-draw{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 1.8s cubic-bezier(.4,.1,.2,1)}
[data-in="true"] .ib-line-draw{stroke-dashoffset:0}
.ib-glow{animation:ib-pulse 2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
@keyframes ib-dash{to{stroke-dashoffset:-14}}
@keyframes ib-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.45;transform:scale(1.35)}}
@keyframes ib-sheet-in{from{opacity:0;transform:translate(14px,-10px) rotate(4deg)}to{opacity:1;transform:none}}
.ib-bento>.ib-frame{display:flex;flex-direction:column}
.ib-bento>.ib-frame>.ib-card{flex:1}
@media (prefers-reduced-motion:reduce){
.ib-reveal{opacity:1;transform:none;transition:none}
.ib-dash,.ib-presence,.ib-glow,.ib-sheet-new{animation:none}
.ib-line-draw{transition:none;stroke-dashoffset:0}
}
`

export function InkOrbitFeatures({
  theme = "dark",
  brand = "JINSHI CORE",
  tag = "ENGINEERING BLUEPRINTS",
  title = "Distributed Systems *\nTelemetry & Architecture*",
  collaboration = {
    title: "Event-Driven Pipelines",
    description: "Asynchronous microservices orchestrating streaming data, state reconciliation, and multi-tenant telemetry.",
  },
  reports = {
    title: "Automated Build Artifacts",
    description: "Continuous benchmark profiling, memory consumption telemetry, and end-to-end integration audits.",
  },
  integrations = {
    title: "Runtime Integrations",
    description: "Deep hooks across Go, PostgreSQL, Redis caches, Cloudflare edge workers, and distributed message queues.",
    tools: ["Postgres", "Redis", "Golang", "Edge"],
  },
  insights = {
    title: "System Performance & Latency",
    description: "Real-time p99 latency curve scrubbing, throughput scaling metrics, and workload capacity forecasting.",
    values: [18, 22, 21, 28, 26, 34, 31, 39, 37, 46, 52, 61],
    forecastFrom: 8,
  },
  className = "",
  style,
}: InkOrbitFeaturesProps) {
  const uid = "ib" + React.useId().replace(/[^a-zA-Z0-9]/g, "")
  const features: InkFeatures = {
    tag,
    title,
    collaboration: { ...D_FEATURES.collaboration, ...collaboration },
    reports: { ...D_FEATURES.reports, ...reports },
    integrations: { ...D_FEATURES.integrations, ...integrations },
    insights: { ...D_FEATURES.insights, ...insights },
  }

  const [isDark, setIsDark] = React.useState(theme === "dark")
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      setIsDark(theme === "dark")
      return
    }
    const colorQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")

    const sync = () => {
      setIsDark(theme === "auto" ? colorQuery.matches : theme === "dark")
      setReduced(motionQuery.matches)
    }

    sync()
    colorQuery.addEventListener?.("change", sync)
    motionQuery.addEventListener?.("change", sync)

    return () => {
      colorQuery.removeEventListener?.("change", sync)
      motionQuery.removeEventListener?.("change", sync)
    }
  }, [theme])

  const [revealRef, inView] = useInView(0.12)

  return (
    <div
      className={`ib-root ${className}`}
      data-theme={isDark ? "dark" : "light"}
      style={style}
    >
      <style>{IB_CSS}</style>
      <div className="ib-shell">
        <section className="ib-sec" aria-labelledby={`${uid}feat`}>
          <div className="ib-reveal" ref={revealRef} data-in={inView}>
            <div className="ib-head" id={`${uid}feat`}>
              {features.tag && <span className="ib-tag">{features.tag}</span>}
              <Title text={features.title} />
            </div>
            <div className="ib-bento">
              <FlowCard
                brand={brand}
                features={features}
                uid={uid}
                reduced={reduced}
                inView={inView}
              />
              <IntegrationsCard copy={features.integrations} reduced={reduced} />
              <InsightsCard copy={features.insights} uid={uid} reduced={reduced} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default InkOrbitFeatures
