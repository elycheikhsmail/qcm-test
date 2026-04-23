"use client";

type Props = {
  isCorrect: boolean;
  explanation?: string;
  correctAnswer?: unknown;
  type?: string;
};

export function AnswerFeedback({ isCorrect, explanation, correctAnswer, type }: Props) {
  return (
    <div
      className={`mt-4 p-4 rounded-lg border ${
        isCorrect
          ? "bg-green-50 border-green-300 text-green-800"
          : "bg-red-50 border-red-300 text-red-800"
      }`}
    >
      <p className="font-semibold">{isCorrect ? "✓ Bonne réponse !" : "✗ Mauvaise réponse"}</p>
      {!isCorrect && correctAnswer !== undefined && (
        <p className="text-sm mt-1">
          Bonne réponse :{" "}
          <span className="font-medium">{formatAnswer(correctAnswer, type)}</span>
        </p>
      )}
      {explanation && <p className="text-sm mt-2 opacity-90">{explanation}</p>}
    </div>
  );
}

function formatAnswer(answer: unknown, type?: string): string {
  if (type === "true_false") {
    return answer === "true" || answer === true ? "Vrai" : "Faux";
  }
  return String(answer);
}
