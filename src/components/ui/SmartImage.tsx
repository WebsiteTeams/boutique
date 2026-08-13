"use client";

import Image from "next/image";
import { useState } from "react";
import { FALLBACK_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

interface SmartImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "auto" | "high" | "low";
  decoding?: "async" | "sync" | "auto";
  className?: string;
  style?: React.CSSProperties;
}

export function SmartImage({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  loading = "lazy",
  fetchPriority,
  decoding,
  className,
  style,
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <img
        src={FALLBACK_IMAGE}
        alt={alt}
        loading={loading}
        className={cn("object-cover", fill && "absolute inset-0 h-full w-full", className)}
        style={style}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={decoding}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
