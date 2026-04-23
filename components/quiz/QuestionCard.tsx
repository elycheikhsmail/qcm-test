"use client";

export type QuestionType = "qcm" | "true_false" | "fill_blank";

export type Question = {
  id: number;
  type: QuestionType;
  content: string;
  options: string[] | null;
  difficulty: "facile" | "moyen" | "difficile";
  order: number;
};

type Props = {
  question: Question;
  selectedAnswer: unknown;
  onAnswer: (answer: unknown) => void;
  disabled?: boolean;
};

const DIFFICULTY_STYLE: Record<string, string> = {
  facile: "bg-green-100 text-green-700",
  moyen: "bg-yellow-100 text-yellow-700",
  difficile: "bg-red-100 text-red-700",
};

export function QuestionCard({ question, selectedAnswer, onAnswer, disabled }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            DIFFICULTY_STYLE[question.difficulty] ?? "bg-gray-100 text-gray-600"
          }`}
        >
          {question.difficulty}
        </span>
      </div>
      <p className="text-gray-900 font-medium text-base mb-6 leading-relaxed">
        {question.content}
      </p>

      {question.type === "qcm" && (
        <QCMOptions
          options={question.options ?? []}
          selected={selectedAnswer as string | null}
          onSelect={onAnswer}
          disabled={disabled}
        />
      )}
      {question.type === "true_false" && (
        <TrueFalseOptions
          selected={selectedAnswer as string | null}
          onSelect={onAnswer}
          disabled={disabled}
        />
      )}
      {question.type === "fill_blank" && (
        <FillBlankInput
          value={selectedAnswer as string | null}
          onChange={onAnswer}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function QCMOptions({
  options,
  selected,
  onSelect,
  disabled,
}: {
  options: string[];
  selected: string | null;
  onSelect: (v: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <button
          key={i}
          type="button"
          onClick={() => !disabled && onSelect(opt)}
          disabled={disabled}
          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors text-sm ${
            selected === opt
              ? "border-blue-500 bg-blue-50 text-blue-900"
              : "border-gray-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50"
          } disabled:cursor-not-allowed`}
        >
          <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
          {opt}
        </button>
      ))}
    </div>
  );
}

function TrueFalseOptions({
  selected,
  onSelect,
  disabled,
}: {
  selected: string | null;
  onSelect: (v: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-4">
      {(["true", "false"] as const).map((val) => (
        <button
          key={val}
          type="button"
          onClick={() => !disabled && onSelect(val)}
          disabled={disabled}
          className={`flex-1 py-3 rounded-lg border-2 font-semibold text-sm transition-colors ${
            selected === val
              ? "border-blue-500 bg-blue-50 text-blue-900"
              : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
          } disabled:cursor-not-allowed`}
        >
          {val === "true" ? "Vrai" : "Faux"}
        </button>
      ))}
    </div>
  );
}

function FillBlankInput({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={disabled}
      placeholder="Votre réponse…"
      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
    />
  );
}
