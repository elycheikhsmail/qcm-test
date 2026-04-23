"use client";

type Point = { semaine: string; moyenne: number };
type Serie = { label: string; points: Point[] };

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const W = 540;
const H = 220;
const PAD = { top: 16, right: 16, bottom: 40, left: 40 };

export default function LineChart({ series }: { series: Serie[] }) {
  if (!series.length || series.every((s) => s.points.length === 0)) {
    return <p className="text-sm text-gray-400 py-4">Pas de données suffisantes.</p>;
  }

  // Collect all weeks sorted
  const allWeeks = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.semaine)))).sort();
  if (allWeeks.length < 2) {
    return <p className="text-sm text-gray-400 py-4">Données insuffisantes (moins de 2 semaines).</p>;
  }

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function xPos(week: string) {
    const i = allWeeks.indexOf(week);
    return PAD.left + (i / (allWeeks.length - 1)) * innerW;
  }
  function yPos(val: number) {
    return PAD.top + innerH - (val / 20) * innerH;
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl" aria-hidden="true">
        {/* Grid lines */}
        {[0, 5, 10, 15, 20].map((v) => (
          <g key={v}>
            <line x1={PAD.left} y1={yPos(v)} x2={W - PAD.right} y2={yPos(v)} stroke="#e5e7eb" strokeWidth="1" />
            <text x={PAD.left - 6} y={yPos(v) + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{v}</text>
          </g>
        ))}

        {/* X-axis labels (every other week to avoid clutter) */}
        {allWeeks.map((w, i) => i % Math.max(1, Math.floor(allWeeks.length / 6)) === 0 && (
          <text key={w} x={xPos(w)} y={H - 8} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {w.slice(5)} {/* MM-DD */}
          </text>
        ))}

        {/* Series */}
        {series.map((serie, si) => {
          const color = COLORS[si % COLORS.length];
          const pts = serie.points.map((p) => `${xPos(p.semaine)},${yPos(p.moyenne)}`).join(" ");
          return (
            <g key={serie.label}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
              {serie.points.map((p) => (
                <circle key={p.semaine} cx={xPos(p.semaine)} cy={yPos(p.moyenne)} r="3" fill={color}>
                  <title>{serie.label} — {p.semaine} : {p.moyenne}/20</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s, i) => (
          <span key={s.label} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
