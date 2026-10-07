"use client";

import { cn } from "@/lib/utils";
import SmoothButton from "@/components/ui/smooth-button";
import { motion, useReducedMotion } from "motion/react";
import type { KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface CoverflowCarouselItem {
  alt?: string;
  content?: ReactNode;
  id: string;
  image?: string;
}

export interface CoverflowCarouselProps {
  autoplay?: boolean;
  autoplayDelay?: number;
  className?: string;
  cardClassName?: string;
  cardHeight?: number | string;
  cardWidth?: number | string;
  containerHeight?: number | string;
  depth?: number;
  index?: number;
  inverted?: boolean;
  items: CoverflowCarouselItem[];
  loop?: boolean;
  onIndexChange?: (index: number) => void;
  rotation?: number;
  scaleStep?: number;
  spacing?: number;
}

interface DragInfo {
  offset: { x: number; y: number };
  velocity: { x: number; y: number };
}

const DEFAULT_DEPTH = 180;
const DEFAULT_ROTATION = 45;
const DEFAULT_SPACING = 280;
const DEFAULT_SCALE_STEP = 0.15;
const DEFAULT_AUTOPLAY_DELAY = 4000;
const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_DISTANCE_THRESHOLD = 80;
const MAX_VISIBLE_OFFSET = 3;
const MIN_SCALE = 0.4;

export const CoverflowCarousel = ({
  items,
  index: indexProp,
  onIndexChange,
  inverted = false,
  depth = DEFAULT_DEPTH,
  rotation = DEFAULT_ROTATION,
  spacing = DEFAULT_SPACING,
  scaleStep = DEFAULT_SCALE_STEP,
  loop = false,
  autoplay = false,
  autoplayDelay = DEFAULT_AUTOPLAY_DELAY,
  className,
  cardClassName,
  cardHeight = 360,
  cardWidth = 360,
  containerHeight = 420,
}: CoverflowCarouselProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = indexProp !== undefined;
  const activeIndex = isControlled ? indexProp : internalIndex;
  const [isPaused, setIsPaused] = useState(false);
  const total = items.length;

  const goTo = useCallback(
    (next: number) => {
      const clamped = loop
        ? ((next % total) + total) % total
        : Math.min(Math.max(next, 0), total - 1);

      if (!isControlled) {
        setInternalIndex(clamped);
      }
      onIndexChange?.(clamped);
    },
    [isControlled, loop, onIndexChange, total],
  );

  useEffect(() => {
    if (!autoplay || shouldReduceMotion || isPaused || total <= 1) {
      return;
    }

    const timer = setInterval(() => {
      goTo(activeIndex + 1);
    }, autoplayDelay);

    return () => clearInterval(timer);
  }, [
    autoplay,
    shouldReduceMotion,
    isPaused,
    activeIndex,
    autoplayDelay,
    goTo,
    total,
  ]);

  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: DragInfo,
  ) => {
    const isSwipeLeft =
      info.offset.x < -SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x < -SWIPE_VELOCITY_THRESHOLD;
    const isSwipeRight =
      info.offset.x > SWIPE_DISTANCE_THRESHOLD ||
      info.velocity.x > SWIPE_VELOCITY_THRESHOLD;

    if (isSwipeLeft) {
      goTo(activeIndex + 1);
    } else if (isSwipeRight) {
      goTo(activeIndex - 1);
    }
  };

  const dragEndRef = useRef(handleDragEnd);
  dragEndRef.current = handleDragEnd;

  return (
    <div
      aria-label="Coverflow carousel"
      aria-roledescription="carousel"
      className={cn("relative w-full select-none outline-none py-4", className)}
      onBlur={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      style={{ perspective: shouldReduceMotion ? undefined : 1200 }}
      tabIndex={0}
    >
      <motion.div
        className="relative mx-auto flex items-center justify-center overflow-visible"
        style={{ height: containerHeight, transformStyle: "preserve-3d" }}
        drag={total > 1 && !shouldReduceMotion ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.12}
        onDragEnd={(event, info) => dragEndRef.current(event, info)}
      >
        {items.map((item, i) => {
          const offset = i - activeIndex;
          const isVisible = Math.abs(offset) <= MAX_VISIBLE_OFFSET;
          const isActive = offset === 0;

          if (!isVisible) {
            return null;
          }

          const direction = inverted ? -1 : 1;
          const rotateY = shouldReduceMotion
            ? 0
            : direction * -offset * rotation;
          const translateX = offset * spacing;
          const translateZ = shouldReduceMotion ? 0 : -Math.abs(offset) * depth;
          const scale = Math.max(1 - Math.abs(offset) * scaleStep, MIN_SCALE);

          return (
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: isActive ? 1 : 0, x: translateX }
                  : {
                      opacity: isActive ? 1 : Math.max(0.4, 1 - Math.abs(offset) * 0.25),
                      rotateY,
                      scale,
                      x: translateX,
                      z: translateZ,
                    }
              }
              aria-hidden={!isActive}
              className={cn(
                "absolute overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12] shadow-2xl transition-colors",
                isActive ? "border-[#D97757]/40 ring-1 ring-[#D97757]/20 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)]" : "opacity-60",
                cardClassName
              )}
              key={item.id}
              style={{
                width: cardWidth,
                height: cardHeight,
                transformStyle: "preserve-3d",
                zIndex: total - Math.abs(offset),
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { bounce: 0.1, duration: 0.25, type: "spring" }
              }
            >
              {item.image ? (
                <img
                  alt={item.alt ?? ""}
                  className="h-full w-full object-cover"
                  draggable={false}
                  src={item.image}
                />
              ) : (
                <div className="size-full">
                  {item.content}
                </div>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* Control Navigation Bar */}
      <div className="mt-8 flex items-center justify-center gap-6">
        <SmoothButton
          aria-label="Previous slide"
          disabled={!loop && activeIndex === 0}
          onClick={() => goTo(activeIndex - 1)}
          shape="pill"
          size="sm"
          variant="outline"
        >
          &larr; Prev
        </SmoothButton>

        {/* Slide Counter Indicator */}
        <div className="flex items-center gap-2 font-mono text-xs text-white/40">
          <span className="text-[#D97757] font-semibold">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          <span>/</span>
          <span>{String(total).padStart(2, "0")}</span>
        </div>

        <SmoothButton
          aria-label="Next slide"
          disabled={!loop && activeIndex === total - 1}
          onClick={() => goTo(activeIndex + 1)}
          shape="pill"
          size="sm"
          variant="outline"
        >
          Next &rarr;
        </SmoothButton>
      </div>

      <div aria-live="polite" className="sr-only">
        {`Slide ${activeIndex + 1} of ${total}`}
      </div>
    </div>
  );
};

export default CoverflowCarousel;
