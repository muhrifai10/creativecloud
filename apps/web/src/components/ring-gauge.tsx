export function RingGauge({
  used,
  total,
  color,
  size = 56,
  isWhite = false,
  isDark = false,
}: {
  used: number;
  total: number;
  color: string;
  size?: number;
  isWhite?: boolean;
  isDark?: boolean;
}) {
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const gaugeColor = isWhite ? "#ffffff" : pct > 0.9 ? "#F43F5E" : pct > 0.8 ? "#F97316" : color;
  const trackColor = isDark
    ? "rgba(255, 255, 255, 0.1)"
    : isWhite
    ? "rgba(255, 255, 255, 0.25)"
    : "#EEF2F6";
  const textColor = isDark || isWhite ? "#ffffff" : "#1E293B";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Terpakai ${Math.round(pct * 100)} persen`}
      className="shrink-0"
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={gaugeColor}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-700 ease-out"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight={700}
        fill={textColor}
        className="tabular-nums"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
