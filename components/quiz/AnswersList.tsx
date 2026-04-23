"use client";

export type ResultItem = {
  question_id: number;
  type: string;
  content: string;
  options: unknown | null;
  difficulty: string;
  order: number;
  correct_answer: unknown;
  given_answer: unknown | null;
  is_correct: boolean | null;
};

type Props = { items: ResultItem[] };

export function AnswersList({ items }: Props) {
  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={item.question_id}
          className={`bg-white rounded-xl border-2 p-5 ${
            item.is_correct ? "border-green-300" : "border-red-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`text-xl mt-0.5 flex-shrink-0 ${
                item.is_correct ? "text-green-500" : "text-red-500"
              }`}
            >
              {item.is_correct ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-1">Question {i + 1}</p>
              <p className="font-medium text-gray-900 mb-3 leading-snug">{item.content}</p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-gray-500">Ta réponse : </span>
                  <span
                    className={
                      item.is_correct
                        ? "text-green-700 font-medium"
                        : "text-red-700 font-medium"
                    }
                  >
                    {formatAnswer(item.given_answer, item.type)}
                  </span>
                </p>
                {!item.is_correct && (
                  <p>
                    <span className="text-gray-500">Bonne réponse : </span>
                    <span className="text-green-700 font-medium">
                      {formatAnswer(item.correct_answer, item.type)}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatAnswer(answer: unknown, type: string): string {
  if (answer === null || answer === undefined) return "(sans réponse)";
  if (type === "true_false") {
    return answer === "true" || answer === true ? "Vrai" : "Faux";
  }
  return String(answer);
}
