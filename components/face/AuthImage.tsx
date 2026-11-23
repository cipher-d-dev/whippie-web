"use client";

import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { apiGetBlob } from "@/lib/api/client";
import { cn } from "@/lib/utils/cn";

/** An image that needs the signed-in user's token (face photos, selfies). */
export function AuthImage({ path, alt, className }: { path: string; alt: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    setSrc(null);
    setFailed(false);
    apiGetBlob(path)
      .then((b) => {
        if (cancelled) return;
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [path]);

  if (failed) {
    return (
      <div className={cn("flex flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground", className)}>
        <ImageOff className="h-5 w-5" /> No photo
      </div>
    );
  }
  if (!src) return <div className={cn("animate-pulse bg-muted", className)} aria-label={`Loading ${alt}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-cover", className)} />;
}

/** Reference photo next to a check-in selfie, for HR to compare. */
export function FaceCompare({ internId, attendanceId, score }: { internId: string; attendanceId: string; score?: number | null }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <figure>
          <AuthImage path={`/api/v1/face/${internId}/photo`} alt="Approved face photo" className="aspect-[3/4] w-full -scale-x-100 rounded-lg" />
          <figcaption className="mt-1 text-center text-xs text-muted-foreground">Approved photo</figcaption>
        </figure>
        <figure>
          <AuthImage path={`/api/v1/face/checkins/${attendanceId}/selfie`} alt="Check-in selfie" className="aspect-[3/4] w-full -scale-x-100 rounded-lg" />
          <figcaption className="mt-1 text-center text-xs text-muted-foreground">Check-in selfie</figcaption>
        </figure>
      </div>
      {typeof score === "number" && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Match score <span className="font-mono text-foreground">{Math.round(score * 100)}%</span>
        </p>
      )}
    </div>
  );
}
