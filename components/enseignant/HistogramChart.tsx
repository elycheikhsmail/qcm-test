type Bar = { label: string; count: number };

const W = 320;
const H = 140;
const PAD = { t: 16, b: 36, l: 32, r: 12 };
const chartW = W - PAD.l - PAD.r;
const chartH = H - PAD.t - PAD.b;

export function HistogramChart({ data }: { data: Bar[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const barW = chartW / data.length;
  const GAP = 6;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      className="w-full max-w-sm"
      aria-label="Distribution des notes"
    >
      {/* Gridlines */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.t + chartH - frac * chartH;
        return (
          <line
            key={frac}
            x1={PAD.l}
            y1={y}
            x2={PAD.l + chartW}
            y2={y}
            stroke="#f3f4f6"
            strokeWidth={1}
          />
        );
      })}

      {/* Y axis */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + chartH} stroke="#e5e7eb" strokeWidth={1} />
      <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" fontSize={9} fill="#9ca3af">{maxCount}</text>
      <text x={PAD.l - 4} y={PAD.t + chartH} textAnchor="end" fontSize={9} fill="#9ca3af">0</text>

      {/* Bars */}
      {data.map((d, i) => {
        const barH = maxCount > 0 ? (d.count / maxCount) * chartH : 0;
        const x = PAD.l + i * barW + GAP / 2;
        const y = PAD.t + chartH - barH;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barW - GAP}
              height={Math.max(barH, 1)}
              fill={d.count === 0 ? "#e5e7eb" : "#3b82f6"}
              rx={3}
            />
            {d.count > 0 && (
              <text
                x={x + (barW - GAP) / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={10}
                fontWeight="600"
                fill="#1d4ed8"
              >
                {d.count}
              </text>
            )}
            <text
              x={x + (barW - GAP) / 2}
              y={PAD.t + chartH + 14}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* X axis label */}
      <text
        x={PAD.l + chartW / 2}
        y={H - 4}
        textAnchor="middle"
        fontSize={9}
        fill="#9ca3af"
      >
        Note /20
      </text>
    </svg>
  );
}
