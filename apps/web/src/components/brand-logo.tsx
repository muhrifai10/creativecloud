"use client";

import Image from "next/image";

interface BrandLogoProps {
  theme?: "dark" | "light" | "auto" | "white";
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  className?: string;
}

export function BrandLogo({
  theme = "white",
  size = "md",
  markOnly = false,
  className = "",
}: BrandLogoProps) {
  if (markOnly) {
    const dim = size === "sm" ? 26 : size === "lg" ? 44 : 32;
    return (
      <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
        <Image
          src="/logo-mark.webp"
          alt="Creative Drive"
          width={dim}
          height={dim}
          sizes={`${dim}px`}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  // Full horizontal logo (aspect ratio ~ 6.05)
  const height = size === "sm" ? 22 : size === "lg" ? 36 : 28;
  const width = Math.round(height * 6.05);

  if (theme === "white" || theme === "dark") {
    return (
      <div className={`relative shrink-0 flex items-center ${className}`}>
        <Image
          src="/logo-white.webp"
          alt="Creative Drive"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  if (theme === "light") {
    return (
      <div className={`relative shrink-0 flex items-center ${className}`}>
        <Image
          src="/logo-light.webp"
          alt="Creative Drive"
          width={width}
          height={height}
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={`relative shrink-0 flex items-center ${className}`}>
      <Image
        src="/logo-white.webp"
        alt="Creative Drive"
        width={width}
        height={height}
        className="hidden dark:block object-contain"
        priority
      />
      <Image
        src="/logo-light.webp"
        alt="Creative Drive"
        width={width}
        height={height}
        className="block dark:hidden object-contain"
        priority
      />
    </div>
  );
}
