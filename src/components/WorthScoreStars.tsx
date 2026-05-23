"use client";

import { useState, useCallback } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorthScoreStarsProps {
  rating: number;
  onChange: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function WorthScoreStars({
  rating,
  onChange,
  readonly = false,
  size = "md",
}: WorthScoreStarsProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [clickedIndex, setClickedIndex] = useState<number | null>(null);

  const activeRating = hovered ?? rating;
  const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  const handleClick = useCallback(
    (starRating: number) => {
      if (readonly) return;
      setClickedIndex(starRating);
      onChange(starRating);
      setTimeout(() => setClickedIndex(null), 300);
    },
    [readonly, onChange],
  );

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", readonly && "cursor-default")}
      onMouseLeave={() => setHovered(null)}
    >
      {[1, 2, 3, 4, 5].map((starRating) => {
        const isActive = starRating <= activeRating;
        const isClicked = clickedIndex === starRating;

        return (
          <button
            key={starRating}
            type="button"
            disabled={readonly}
            aria-label={`Rate ${starRating} out of 5`}
            className={cn(
              "transition-transform duration-150",
              isClicked && "star-bounce",
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            )}
            onClick={() => handleClick(starRating)}
            onMouseEnter={() => !readonly && setHovered(starRating)}
          >
            <Star
              className={cn(
                iconSize,
                "transition-colors duration-150",
                isActive
                  ? "fill-primary text-primary"
                  : "fill-none text-muted-foreground/40",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
