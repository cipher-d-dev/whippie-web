"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

interface WhippieLogoProps {
  className?: string;
  size?: number;
}

/**
 * WhippieLogo — shows dark.png on dark mode, light.png on light mode.
 * Handles the hydration flash by waiting for theme to mount.
 */
export function WhippieLogo({ className, size = 48 }: WhippieLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Before mount, render a placeholder the same size to avoid layout shift
  if (!mounted) {
    return (
      <div
        style={{ width: size, height: size }}
        className={cn("bg-muted animate-pulse rounded-lg", className)}
      />
    );
  }

  const src = resolvedTheme === "dark" ? "/logo-dark.png" : "/logo-light.png";

  return (
    <Image
      src={src}
      alt="Whippie"
      width={size}
      height={size}
      className={cn("object-contain", className)}
      priority
    />
  );
}
