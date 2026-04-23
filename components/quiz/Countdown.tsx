"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** durée totale en secondes */
  totalSeconds: number;
  /** appelé quand le timer atteint 0 */
  onExpire: () => void;
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function Countdown({ totalSeconds, onExpire }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expired = useRef(false);

  useEffect(() => {
    if (totalSeconds <= 0) {
      if (!expired.current) {
        expired.current = true;
        onExpire();
      }
      return;
    }
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!expired.current) {
            expired.current = true;
            onExpire();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [totalSeconds, onExpire]);

  const pct = totalSeconds > 0 ? remaining / totalSeconds : 0;
  const isWarning = pct < 0.25;
  const isDanger = pct < 0.1;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-semibold ${
        isDanger
          ? "bg-red-100 text-red-700"
          : isWarning
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-50 text-blue-700"
      }`}
    >
      <span className="text-xs font-sans font-medium">Temps</span>
      <span>{fmt(remaining)}</span>
    </div>
  );
}
