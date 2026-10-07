"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface WorksWheelItem {
  /** Project name. Shown beside the front card and in the index. */
  title: string;
  /** Cover art. Any src an <img> takes. */
  image: string;
  /** Where the card links to. Omit for a wheel that only browses. */
  href?: string;
}

export interface WorksWheelProps extends Omit<
  React.ComponentPropsWithoutRef<"div">,
  "children"
> {
  items: WorksWheelItem[];
  /** Sits in the middle of the ring. @default "Works '26" */
  label?: string;
  /** Label on the card's hover affordance. @default "Launch" */
  action?: string;
  /** Enables sticky window scrolling to drive the wheel. @default true */
  sticky?: boolean;
}

/* Geometry tuned for dramatic, immersive presence */
const CARD_H = 0.48; // front card height, of the stage
const CARD_MAX_W = 0.46; // ... but never wider than this much of the stage
const CARD_RATIO = 1.45; // card width / height
const STEP = 40; // degrees between cards on the drum
const DRUM = 2.22; // drum radius, in card heights
const LENS = 2.75; // perspective distance
const RING_R = 1.18; // ring radius
const BOW = 1.72; // arc radius
const TITLE = 0.124; // ring label size
const CULL = 1.8;

const WHEEL_UNITS = 900;
const DRAG_UNITS = 420;
const SETTLE = 140;
const EASE = 0.12;

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Stage = { w: number; h: number };

const rad = (deg: number) => (deg * Math.PI) / 180;

const bowAt = (drumDeg: number, bow: number) =>
  -bow * (1 - Math.cos(rad(drumDeg)));

function place(
  ringDeg: number,
  drumDeg: number,
  ringR: number,
  drumR: number,
  bow: number,
  m: number,
) {
  return (
    `translateX(${m * bowAt(drumDeg, bow)}px)` +
    ` rotateZ(${(1 - m) * ringDeg}deg) translateY(${-(1 - m) * ringR}px)` +
    ` rotateX(${m * drumDeg}deg) translateZ(${m * drumR}px)`
  );
}

export function WorksWheel({
  items,
  label = "Works '26",
  action = "Launch",
  sticky = true,
  className,
  ...props
}: WorksWheelProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLElement | null)[]>([]);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);

  const turn = React.useRef(0);
  const target = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>({ w: 0, h: 0 });

  const count = items.length;
  const last = Math.max(count - 1, 0);

  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  React.useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const read = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const metrics = React.useMemo(() => {
    const { w, h } = stage;
    const isMobile = w > 0 && w < 640;
    const cardMaxWFactor = isMobile ? 0.76 : CARD_MAX_W;
    const cardHFactor = isMobile ? 0.40 : CARD_H;
    const cardW = Math.min(h * cardHFactor * CARD_RATIO, w * cardMaxWFactor);
    const cardH = cardW / CARD_RATIO;
    const drumR = cardH * DRUM;
    const ringR = cardH * (isMobile ? 1.05 : RING_R);
    const ringScale = count
      ? clamp((((2 * Math.PI * ringR) / count) * 0.82) / (cardW || 1), 0.16, 1)
      : 1;
    return {
      cardW,
      cardH,
      ringR,
      ringScale,
      drumR,
      bow: cardH * (isMobile ? 1.0 : BOW),
      depth: cardH * LENS,
      title: Math.max(28, cardH * TITLE),
    };
  }, [stage, count]);

  // One pass per frame: ease toward the target, then write every transform.
  React.useEffect(() => {
    if (!stage.h) return;
    let frame = 0;
    const { ringR, ringScale, drumR, bow } = metrics;

    const draw = () => {
      frame = requestAnimationFrame(draw);
      const gap = target.current - turn.current;
      if (Math.abs(gap) < 0.0005) turn.current = target.current;
      else turn.current += gap * (reduced ? 1 : EASE);

      const t = turn.current;
      const m = clamp(t, 0, 1);
      const pos = Math.max(0, t - 1);

      if (wheelRef.current) {
        wheelRef.current.style.transform = `translateZ(${-m * drumR}px)`;
      }

      for (let i = 0; i < count; i++) {
        const d = i - pos;
        const drumDeg = d * STEP;
        const card = cardRefs.current[i];
        if (card) {
          card.style.transform = place(
            d * (360 / count),
            drumDeg,
            ringR,
            drumR,
            bow,
            m,
          );
          card.style.opacity = m > 0.5 && Math.abs(d) > CULL ? "0" : "1";
          card.style.zIndex = String(Math.round(100 - Math.abs(d) * 2));
        }
        const face = card?.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${lerp(ringScale, 1, m)})`;
      }

      if (labelRef.current) labelRef.current.style.opacity = String(Math.max(0, 1 - m * 2));
      if (titleRef.current) titleRef.current.style.opacity = String(clamp((m - 0.15) * 1.5, 0, 1));
      const near = clamp(Math.round(pos), 0, last);
      setActive((prev) => (prev === near ? prev : near));
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [metrics, stage.h, count, last, reduced]);

  const to = React.useCallback(
    (next: number) => {
      target.current = clamp(next, 0, last + 1);
    },
    [last],
  );

  // Sticky Window Scroll Listener
  React.useEffect(() => {
    if (!sticky) return;
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!track) return;
        const rect = track.getBoundingClientRect();
        const maxScroll = track.offsetHeight - window.innerHeight;
        if (maxScroll <= 0) return;
        const currentScroll = -rect.top;
        const progress = clamp(currentScroll / maxScroll, 0, 1);

        // Smooth mapping across the scroll range:
        // 0..0.05: Ring stays at rest or starts opening
        // 0.05..0.95: Smoothly rotates through all items (1..count)
        // >=0.95: Last item rests at the front, then unpins cleanly
        let turnValue = 0;
        if (progress <= 0.05) {
          turnValue = (progress / 0.05) * 0.8;
        } else {
          const pNorm = (progress - 0.05) / 0.95;
          turnValue = 1 + pNorm * (count - 1);
        }
        target.current = clamp(turnValue, 0, count);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky, count]);

  // Non-sticky wheel listener (only active when sticky is false)
  const settling = React.useRef(0);
  React.useEffect(() => {
    if (sticky) return;
    const el = stageRef.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      const next = target.current + event.deltaY / WHEEL_UNITS;
      if (next > 0 && next < last + 1) event.preventDefault();
      to(next);
      window.clearTimeout(settling.current);
      settling.current = window.setTimeout(
        () => to(Math.round(target.current)),
        SETTLE,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      window.clearTimeout(settling.current);
    };
  }, [sticky, to, last]);

  const scrollToItem = (idx: number) => {
    if (sticky && trackRef.current) {
      const track = trackRef.current;
      const maxScroll = track.offsetHeight - window.innerHeight;
      const pNorm = count > 1 ? idx / (count - 1) : 0;
      const itemProgress = 0.06 + pNorm * 0.88;
      const targetY = window.scrollY + track.getBoundingClientRect().top + itemProgress * maxScroll;
      window.scrollTo({ top: targetY, behavior: "smooth" });
    } else {
      to(idx + 1);
    }
  };

  const drag = React.useRef<number | null>(null);

  const innerContent = (
    <div
      ref={stageRef}
      tabIndex={0}
      role="listbox"
      aria-label={label}
      aria-activedescendant={`works-wheel-${active}`}
      className={cn(
        "focus-visible:outline-[#D97757] absolute inset-0 outline-none select-none touch-pan-y",
        !sticky && "cursor-grab active:cursor-grabbing"
      )}
      style={{ perspective: `${metrics.depth}px` }}
      onPointerDown={(event) => {
        if (sticky) return;
        drag.current = event.clientY;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (sticky || drag.current === null) return;
        to(target.current + (drag.current - event.clientY) / DRAG_UNITS);
        drag.current = event.clientY;
      }}
      onPointerUp={() => {
        if (sticky) return;
        drag.current = null;
        if (target.current > 1) to(Math.round(target.current));
      }}
      onKeyDown={(event) => {
        if (sticky) return;
        if (event.key === "ArrowDown") to(Math.round(target.current) + 1);
        else if (event.key === "ArrowUp") to(Math.round(target.current) - 1);
        else return;
        event.preventDefault();
      }}
    >
      <div
        ref={wheelRef}
        className="absolute top-1/2 left-1/2 [transform-style:preserve-3d]"
      >
        {items.map((item, i) => {
          const Tag = (item.href ? "a" : "div") as "a";
          return (
            <React.Fragment key={item.title}>
              <Tag
                id={`works-wheel-${i}`}
                role="option"
                aria-selected={i === active}
                href={item.href}
                target={item.href?.startsWith("http") ? "_blank" : undefined}
                rel={item.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                ref={(node: HTMLElement | null) => {
                  cardRefs.current[i] = node;
                }}
                className="group absolute [backface-visibility:hidden]"
                style={{
                  width: metrics.cardW,
                  height: metrics.cardH,
                  marginLeft: -metrics.cardW / 2,
                  marginTop: -metrics.cardH / 2,
                }}
              >
                <span className="bg-[#0e0e14]/90 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7)] relative block size-full overflow-hidden rounded-2xl transition-transform duration-300 group-hover:scale-[1.02]">
                  <img
                    src={item.image}
                    alt={item.title}
                    draggable={false}
                    className="size-full object-cover"
                  />
                  {action && item.href ? (
                    <span className="bg-black/85 text-[#EDE8DF] border border-white/20 pointer-events-none absolute right-4 bottom-4 flex translate-y-1 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs opacity-0 backdrop-blur-md transition group-hover:translate-y-0 group-hover:opacity-100 font-mono">
                      <svg
                        viewBox="0 0 12 12"
                        className="size-3 text-[#D97757]"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 9 9 3M4 3h5v5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {action}
                    </span>
                  ) : null}
                </span>
              </Tag>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  const overlayElements = (
    <>
      {/* Center Ring label when at rest */}
      <div
        ref={labelRef}
        className="pointer-events-none absolute inset-0 grid place-items-center tracking-tight font-serif text-[#EDE8DF] select-none z-10"
        style={{ fontSize: metrics.title }}
      >
        <div className="text-center space-y-2">
          <span className="block text-xs font-mono uppercase tracking-[0.3em] text-[#D97757]">
            Interactive 3D Reel
          </span>
          <span className="block text-3xl md:text-5xl font-serif">
            {label}
          </span>
          <span className="block text-[11px] font-mono text-white/40 tracking-wider">
            Scroll down to unfold
          </span>
        </div>
      </div>

      {/* Front-card project title - positioned in top-left quadrant so it NEVER overlaps center 3D cards */}
      <div
        ref={titleRef}
        className="pointer-events-none absolute top-6 left-6 md:top-10 md:left-12 lg:top-14 lg:left-16 z-20 max-w-[280px] sm:max-w-xs md:max-w-md transition-opacity duration-200"
      >
        <div className="space-y-1.5 md:space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono font-semibold tracking-widest text-[#D97757]">
              {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
              Selected Work
            </span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-[1.1] tracking-tight line-clamp-2">
            {items[active]?.title}
          </h3>
        </div>
      </div>

      {/* Index on the top-right */}
      <ol
        className="text-white/40 absolute top-6 right-6 md:top-10 md:right-12 lg:top-14 lg:right-16 text-right leading-[1.8] hidden sm:block z-20"
      >
        {items.map((item, i) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => scrollToItem(i)}
              className={cn(
                "focus-visible:outline-[#D97757] cursor-pointer transition-colors outline-none focus-visible:outline-1 font-mono text-[11px] uppercase tracking-wider hover:text-white block ml-auto",
                i === active && "text-[#D97757] font-semibold",
              )}
            >
              <span className="text-white/20 mr-2 text-[10px]">{String(i + 1).padStart(2, "0")}</span>
              {item.title}
            </button>
          </li>
        ))}
      </ol>

      {/* Bottom subtle progress & scroll prompt */}
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">
          <span>{sticky ? "Scroll to Explore" : "Drag or Click to Explore"}</span>
          <span className="animate-bounce">↓</span>
        </div>
        <div className="w-32 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#D97757] transition-all duration-150"
            style={{ width: `${clamp(((active + 1) / count) * 100, 15, 100)}%` }}
          />
        </div>
      </div>
    </>
  );

  if (sticky) {
    return (
      <div
        ref={trackRef}
        className={cn("relative w-full bg-transparent", className)}
        style={{ height: `${Math.max(180, (count + 0.5) * 45)}vh` }}
        {...props}
      >
        <section
          aria-label={label}
          className="sticky top-0 h-screen w-full overflow-hidden select-none bg-transparent"
        >
          {innerContent}
          {overlayElements}
        </section>
      </div>
    );
  }

  return (
    <section
      aria-label={label}
      className={cn(
        "relative h-full min-h-[36rem] w-full overflow-hidden select-none bg-transparent",
        className,
      )}
      {...props}
    >
      {innerContent}
      {overlayElements}
    </section>
  );
}

export default WorksWheel;
