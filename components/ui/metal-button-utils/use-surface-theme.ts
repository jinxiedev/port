"use client";

import * as React from "react";

export type SurfaceTheme = "auto" | "dark" | "light";

export function useSurfaceTheme(theme: SurfaceTheme = "auto"): "dark" | "light" {
  const [resolvedTheme, setResolvedTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    if (theme === "dark" || theme === "light") {
      setResolvedTheme(theme);
      return;
    }

    const resolve = () => {
      if (typeof document !== "undefined") {
        if (document.documentElement.classList.contains("dark")) {
          return "dark";
        }
        if (document.documentElement.classList.contains("light")) {
          return "light";
        }
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          return "dark";
        }
      }
      return "dark";
    };

    setResolvedTheme(resolve());

    const observer = new MutationObserver(() => {
      setResolvedTheme(resolve());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onMediaChange = () => setResolvedTheme(resolve());
    media.addEventListener("change", onMediaChange);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMediaChange);
    };
  }, [theme]);

  return resolvedTheme;
}
