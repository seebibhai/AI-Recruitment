import React from "react";

const CATEGORY_COLORS = {
  strong_match: "#12B7A2",
  potential_match: "#5B6EF5",
  needs_review: "#F5A623",
  low_match: "#E5484D",
};

function colorForScore(score) {
  if (score >= 85) return CATEGORY_COLORS.strong_match;
  if (score >= 70) return CATEGORY_COLORS.potential_match;
  if (score >= 50) return CATEGORY_COLORS.needs_review;
  return CATEGORY_COLORS.low_match;
}

/**
 * The platform's signature score visualization: a circular progress ring
 * with the percentage in the center, color-coded by match category. Used
 * consistently across candidate cards, tables, and profile headers so a
 * score is always instantly recognizable regardless of context.
 */
export default function MatchRing({ score = 0, size = 56, strokeWidth = 5, showLabel = true, className = "" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference - (clamped / 100) * circumference;
  const color = colorForScore(clamped);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E4E7EC" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      {showLabel && (
        <span className="absolute font-mono font-semibold text-ink-900" style={{ fontSize: size * 0.28 }}>
          {Math.round(clamped)}
        </span>
      )}
    </div>
  );
}

export function categoryLabel(category) {
  return {
    strong_match: "Strong Match",
    potential_match: "Potential Match",
    needs_review: "Needs Review",
    low_match: "Low Match",
  }[category] || category;
}

export function categoryColor(category) {
  return CATEGORY_COLORS[category] || "#94A3B8";
}

export function CategoryBadge({ category }) {
  const color = categoryColor(category);
  return (
    <span
      className="badge"
      style={{ backgroundColor: `${color}1A`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {categoryLabel(category)}
    </span>
  );
}
