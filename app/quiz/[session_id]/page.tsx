"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard, type Question } from "@/components/quiz/QuestionCard";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { AnswerFeedback } from "@/components/quiz/AnswerFeedback";

type FeedbackState = {
  isCorrect: boolean;
  questionId: number;
} | null;

const LS_KEY = "qcm_session";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function QuizPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = use(params);
  const sessionId = Number(session_id);
  const router = useRouter();

  // Si le segment est un token UUID (magic link), rediriger vers la page d'accueil
  // qui validera le token puis enverra sur /quiz/select.
  useEffect(() => {
    if (UUID_RE.test(session_id)) {
      router.replace(`/?token=${session_id}`);
    }
  }, [session_id, router]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Restore session from localStorage
  useEffect(() => {
    if (Number.isNaN(sessionId)) return;
    const saved = localStorage.getItem(LS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.sessionId === sessionId) {
          setIndex(parsed.index ?? 0);
          setAnswers(parsed.answers ?? {});
        }
      } catch {
        // ignore corrupt data
      }
    }
  }, [sessionId]);

  // Fetch questions
  useEffect(() => {
    if (Number.isNaN(sessionId)) return; // UUID magic link — redirect en cours
    fetch(`/api/quiz/sessions/${sessionId}/questions`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) {
          setLoadError(d.error ?? "Impossible de charger les questions.");
          return;
        }
        if (d.data.submitted) {
          router.replace(`/quiz/${sessionId}/results`);
          return;
        }
        setQuestions(d.data.questions);
      })
      .catch(() => setLoadError("Erreur réseau."));
  }, [sessionId, router]);

  // Persist to localStorage on state changes
  useEffect(() => {
    if (questions.length === 0) return;
    localStorage.setItem(LS_KEY, JSON.stringify({ sessionId, index, answers }));
  }, [sessionId, index, answers]);

  const current = questions[index];

  async function submitAnswer(questionId: number, answer: unknown) {
    try {
      const res = await fetch("/api/quiz/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
          given_answer: answer,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ isCorrect: data.data.is_correct, questionId });
      }
    } catch {
      // non-blocking — answer is still recorded locally
    }
  }

  async function handleAnswer(answer: unknown) {
    if (!current || feedback) return;
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
    // For fill_blank, submission is deferred to handleConfirm
    if (current.type !== "fill_blank") {
      await submitAnswer(current.id, answer);
    }
  }

  async function handleConfirm() {
    if (!current || feedback) return;
    const answer = answers[current.id];
    if (answer == null) return;
    await submitAnswer(current.id, answer);
  }

  function handleNext() {
    setFeedback(null);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    }
  }

  function handlePrev() {
    setFeedback(null);
    if (index > 0) setIndex(index - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/quiz/sessions/${sessionId}/submit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Erreur lors de la soumission.");
        return;
      }
      localStorage.removeItem(LS_KEY);
      router.push(`/quiz/${sessionId}/results`);
    } catch {
      setSubmitError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{loadError}</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm text-blue-600 underline"
          >
            Retour à l&apos;accueil
          </button>
        </div>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-400">Chargement du quiz…</p>
      </main>
    );
  }

  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;

  return (
    <main className="min-h-screen bg-gray-50 p-4" dir="ltr">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Progress */}
        <ProgressBar current={index + 1} total={questions.length} />

        {/* Question */}
        <QuestionCard
          question={current}
          selectedAnswer={answers[current.id] ?? null}
          onAnswer={handleAnswer}
          onConfirm={handleConfirm}
          disabled={!!feedback}
        />

        {/* Feedback */}
        {feedback && feedback.questionId === current.id && (
          <AnswerFeedback isCorrect={feedback.isCorrect} type={current.type} />
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Précédent
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Envoi…" : "Terminer ✓"}
            </button>
          )}
        </div>

        {submitError && <p className="text-sm text-red-600 text-center">{submitError}</p>}

        {/* Quick nav summary */}
        <p className="text-xs text-center text-gray-400">
          {answeredCount} / {questions.length} réponses enregistrées
        </p>
      </div>
    </main>
  );
}
