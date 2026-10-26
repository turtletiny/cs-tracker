import { RATINGS } from "../lib/leetcode";
import type { Rating } from "../types";

interface Props {
  onRate: (rating: Rating) => void;
  compact?: boolean;
  label?: string;
}

export function RatingButtons({ onRate, compact = false, label = "How did it go?" }: Props) {
  return (
    <div className={`rate ${compact ? "rate--compact" : ""}`} role="group" aria-label={label}>
      {!compact && <span className="eyebrow">{label}</span>}
      <div className="rate__buttons">
        {RATINGS.map((r) => (
          <button key={r.id} type="button" className="rate-btn" data-rating={r.id} title={r.hint} onClick={() => onRate(r.id)}>
            <strong>{r.label}</strong>
            {!compact && <span>{r.hint}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
