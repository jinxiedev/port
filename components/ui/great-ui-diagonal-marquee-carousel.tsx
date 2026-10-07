"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
  subtitle?: string;
  tag?: string;
}

export interface DiagonalMarqueeCarouselProps {
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  className?: string;
  cardClassName?: string;
  fadeClassName?: string;
}

const DEFAULT_CARDS: CardItem[] = [
  {
    id: 1,
    url: "https://up.mo0n.qzz.io/iptb4w.webp",
    title: "JinsVision AI Lab",
    subtitle: "Next.js, Cloudflare D1, AWS S3",
    tag: "AI Media Pipeline",
  },
  {
    id: 2,
    url: "https://up.mo0n.qzz.io/cute0i.webp",
    title: "JinxVerse Stream",
    subtitle: "Next.js, TMDB API, Tailwind CSS",
    tag: "Streaming Engine",
  },
  {
    id: 3,
    url: "https://api.lauma.icu/71e6f8.jpeg",
    title: "WhatsApp Autonomous Engine",
    subtitle: "Node.js, Baileys WebSocket",
    tag: "Runtime Automation",
  },
  {
    id: 4,
    url: "https://api.lauma.icu/8807b8.jpeg",
    title: "High-Speed File Distribution",
    subtitle: "React, TypeScript, Supabase, Cloudflare",
    tag: "Storage & CDN",
  },
  {
    id: 5,
    url: "https://api.lauma.icu/76dab2.jpeg",
    title: "Realtime Weather Web",
    subtitle: "React, TypeScript, OpenWeather",
    tag: "Geospatial & Maps",
  },
  {
    id: 6,
    url: "https://api.lauma.icu/2ac30d.jpeg",
    title: "Cosmic Arcade Engine",
    subtitle: "React, Canvas 2D, 60fps Loop",
    tag: "Creative Web",
  },
];

const Card = ({ card, className }: { card: CardItem; className?: string }) => {
  return (
    <div
      className={cn(
        "group relative h-[260px] w-[360px] md:h-[300px] md:w-[410px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0c10] transition-all duration-500 hover:border-[#D97757]/60 hover:shadow-[0_8px_32px_rgba(217,119,87,0.12)]",
        className,
      )}
      style={{ transform: "translateZ(0)" }}
    >
      <img
        src={card.url}
        alt={card.title}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover grayscale-[20%] contrast-[105%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/55 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-80" />

      {/* Card Content Overlay */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none select-none">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest uppercase">
          {card.tag && (
            <span className="text-[#D97757]">
              // {card.tag}
            </span>
          )}
          <span className="text-white/30">
            FOLIO &bull; {String(card.id).padStart(2, "0")}
          </span>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-serif text-lg md:text-xl text-[#EDE8DF] group-hover:text-white transition-colors leading-snug">
            {card.title}
          </h4>
          {card.subtitle && (
            <p className="text-xs font-mono text-white/50 tracking-wide">
              {card.subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const MarqueeRow = ({
  cards,
  speed,
  direction,
  cardClassName,
}: {
  cards: CardItem[];
  speed: number;
  direction: 1 | -1;
  cardClassName?: string;
}) => {
  const animationClass =
    direction === -1 ? "animate-marquee-left" : "animate-marquee-right";

  return (
    <div className="flex w-full overflow-hidden">
      <div
        className={cn(
          "flex shrink-0 cursor-pointer hover:[animation-play-state:paused]",
          animationClass,
        )}
        style={
          {
            "--speed": `${speed}s`,
            transform: "translateZ(0)",
            willChange: "transform",
          } as React.CSSProperties
        }
      >
        <div className="flex shrink-0">
          {cards.map((card, idx) => (
            <div key={`${card.id}-${idx}`} className="shrink-0 pr-8">
              <Card card={card} className={cardClassName} />
            </div>
          ))}
        </div>
        <div className="flex shrink-0">
          {cards.map((card, idx) => (
            <div key={`${card.id}-${idx}-copy`} className="shrink-0 pr-8">
              <Card card={card} className={cardClassName} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function DiagonalMarqueeCarousel({
  cards = DEFAULT_CARDS,
  angle = -25,
  baseSpeed = 120,
  alternateDirections = true,
  className = "",
  cardClassName = "",
  fadeClassName = "",
}: DiagonalMarqueeCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const rotationStyle = {
    transform: `rotate(${angle}deg) translateZ(0)`,
  };

  const rowCards = [...cards, ...cards];
  const rowCardsReverse = [...rowCards].reverse();

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-screen w-full items-center justify-center overflow-hidden",
        className,
      )}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-left {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marquee-right {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left {
          animation: marquee-left var(--speed) linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right var(--speed) linear infinite;
        }
      `,
        }}
      />
      {isVisible && (
        <div
          className="absolute z-0 flex w-[220vw] flex-col gap-8"
          style={rotationStyle}
        >
          <MarqueeRow
            cards={rowCards}
            speed={baseSpeed}
            direction={-1}
            cardClassName={cardClassName}
          />
          <MarqueeRow
            cards={rowCardsReverse}
            speed={baseSpeed - 15 > 20 ? baseSpeed - 15 : 30}
            direction={alternateDirections ? 1 : -1}
            cardClassName={cardClassName}
          />
          <MarqueeRow
            cards={rowCards}
            speed={baseSpeed + 15}
            direction={-1}
            cardClassName={cardClassName}
          />
        </div>
      )}

      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 z-10 h-44 md:h-60 bg-gradient-to-b from-[#08080B] via-[#08080B]/80 to-[#08080B]/0",
          fadeClassName,
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44 md:h-60 bg-gradient-to-t from-[#08080B] via-[#08080B]/80 to-[#08080B]/0",
          fadeClassName,
        )}
      />
    </div>
  );
}
