import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface WhippieLogoProps {
  className?: string;
  size?: number;
  /** "white" for use on the blue brand panel. */
  tone?: "blue" | "white";
}

/**
 * The Whippie mark, cropped tight. The blue mark reads on both light and dark
 * backgrounds, so it doesn't wait for the theme (no placeholder flash).
 */
export function WhippieLogo({ className, size = 48, tone = "blue" }: WhippieLogoProps) {
  return (
    <Image
      src={tone === "white" ? "/mark-white.png" : "/mark.png"}
      alt="Whippie"
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );
}
