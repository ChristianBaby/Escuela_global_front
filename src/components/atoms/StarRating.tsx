import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, max = 5, size = 14, showValue = false, className }: StarRatingProps) {
  const filled = Math.round(rating);

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < filled ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-300"}
        />
      ))}
      {showValue && (
        <span className="ml-1 text-sm font-medium text-gray-600 tabular-nums">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
