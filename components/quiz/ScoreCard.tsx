"use client";

type Props = {
  score: number; // percentage 0–100
  correct: number;
  total: number;
};

export function ScoreCard({ score, correct, total }: Props) {
  const color =
    score >= 80 ? "text-green-600" : score >= 50 ? "text-yellow-600" : "text-red-600";
  const barColor =
    score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
      <div className={`text-6xl font-bold ${color} mb-2`}>{score}%</div>
      <p className="text-gray-600 text-lg">
        {correct} / {total} bonnes réponses
      </p>
      <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
