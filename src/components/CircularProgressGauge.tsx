import { useEffect, useState } from "react";

interface Props {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  label?: string;
  onGoalReached?: () => void;
}

export function CircularProgressGauge({ value, size = 128, strokeWidth = 10, label = "יעד", onGoalReached }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = "gaugeGradient";

  const [reached, setReached] = useState(false);
  useEffect(() => {
    if (clamped >= 100 && !reached) {
      setReached(true);
      onGoalReached?.();
    }
    if (clamped < 100 && reached) setReached(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clamped]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(215 100% 50%)" />
            <stop offset="55%" stopColor="hsl(190 100% 50%)" />
            <stop offset="100%" stopColor="hsl(160 90% 42%)" />
          </linearGradient>
          <radialGradient id="gaugeFill" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="hsl(190 100% 55%)" />
            <stop offset="100%" stopColor="hsl(215 90% 42%)" />
          </radialGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius - strokeWidth / 2 - 2} fill="url(#gaugeFill)" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="stroke-secondary" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={`url(#${gradientId})`}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-extrabold text-white drop-shadow-sm" style={{ textShadow: "0 1px 6px hsl(215 60% 30% / 0.35)" }}>
          {Math.round(clamped)}%
        </span>
      </div>
      <div className="absolute -bottom-6 rounded-full bg-white/70 px-2.5 py-0.5 text-[11px] font-medium text-foreground backdrop-blur-sm border border-white/60 shadow-sm">
        {label}
      </div>
    </div>
  );
}
