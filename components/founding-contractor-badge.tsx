"use client";

import { Star } from "lucide-react";

interface FoundingContractorBadgeProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function FoundingContractorBadge({
  size = "md",
  showText = true,
}: FoundingContractorBadgeProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const paddingClasses = {
    sm: "px-1.5 py-0.5",
    md: "px-2.5 py-1",
    lg: "px-3 py-1.5",
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/70 border border-amber-200 px-3 py-1.5">
      <Star className={`${sizeClasses[size]} text-amber-600 fill-amber-600`} />
      {showText && (
        <span className={`font-semibold text-amber-700 ${textSizes[size]}`}>
          Founding Contractor
        </span>
      )}
    </div>
  );
}
