"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { QuestionCard, type Question } from "@/components/quiz/QuestionCard";
import { ProgressBar } from "@/components/quiz/ProgressBar";
import { AnswerFeedback } from "@/components/quiz/AnswerFeedback";
import { Countdown } from "@/components/quiz/Countdown";

type SessionInfo = {
  session_id: number;
  test_id: number;
  time_mode: string;
  duration_minutes: number | null;
  deadline_at: string | null;
  resumed?: boolean;
};

type FeedbackState = { isCorrect: boolean; questionId: number } | null;

const LS_KEY = "qcm_test_session";

export default function TakeTestPage({ params }: { params: Promise<{ test_id: string }> }) {
  const { test_id } = use(params);
  const testId = Number(test_id);
  const router = useRouter();

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, unknown>>({});
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [startError, setStartError] = useState("");

  const doSubmit = useCallback(
    async (sid: number) => {
      if (submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/quiz/sessions/${sid}/submit`, { method: "POST" });
        const data = await res.json();
        if (!res.ok) { setSubmitError(data.error ?? "Erreur soumission"); return; }
        localStorage.removeItem(LS_KEY);
        router.push(`/quiz/${sid}/results`);
      } catch {
        setSubmitError("Erreur réseau");
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, router],
  );

  // Démarrer ou reprendre la session
  useEffect(() => {
    // Vérifier si une session locale existe pour ce test
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (saved?.testId === testId && saved?.sessionId) {
        // Reprendre directement
        setSessionInfo({
          session_id: saved.sessionId,
          test_id: testId,
          time_mode: saved.time_mode ?? "libre",
          duration_minutes: saved.duration_minutes ?? null,
          deadline_at: saved.deadline_at ?? null,
          resumed: true,
        });
        setIndex(saved.index ?? 0);
        setAnswers(saved.answers ?? {});
        return;
      }
    } catch {
      // ignore
    }

    fetch(`/api/tests/${testId}/sessions`, { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setStartError(d.error ?? "Impossible de démarrer le test"); return; }
        const info: SessionInfo = d.data;
        setSessionInfo(info);
        localStorage.setItem(LS_KEY, JSON.stringify({
          testId,
          sessionId: info.session_id,
          time_mode: info.time_mode,
          duration_minutes: info.duration_minutes,
          deadline_at: info.deadline_at,
          index: 0,
          answers: {},
        }));
      })
      .catch(() => setStartError("Erreur réseau"));
  }, [testId]);

  // Charger les questions une fois la session connue
  useEffect(() => {
    if (!sessionInfo) return;
    fetch(`/api/quiz/sessions/${sessionInfo.session_id}/questions`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setLoadError(d.error ?? "Erreur chargement questions"); return; }
        if (d.data.submitted) {
          router.replace(`/quiz/${sessionInfo.session_id}/results`);
          return;
        }
        if (!d.data.questions || d.data.questions.length === 0) {
          setLoadError("Ce test ne contient aucune question — contactez votre enseignant");
          return;
        }
        setQuestions(d.data.questions);
      })
      .catch(() => setLoadError("Erreur réseau"));
  }, [sessionInfo, router]);

  // Persister l'état dans localStorage
  useEffect(() => {
    if (!sessionInfo || questions.length === 0) return;
    localStorage.setItem(LS_KEY, JSON.stringify({
      testId,
      sessionId: sessionInfo.session_id,
      time_mode: sessionInfo.time_mode,
      duration_minutes: sessionInfo.duration_minutes,
      deadline_at: sessionInfo.deadline_at,
      index,
      answers,
    }));
  }, [testId, sessionInfo, index, answers, questions.length]);

  async function handleAnswer(answer: unknown) {
    const current = questions[index];
    if (!current || feedback || !sessionInfo) return;
    setAnswers((prev) => ({ ...prev, [current.id]: answer }));
    try {
      const res = await fetch("/api/quiz/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionInfo.session_id,
          question_id: current.id,
          given_answer: answer,
        }),
      });
      const data = await res.json();
      if (res.ok) setFeedback({ isCorrect: data.data.is_correct, questionId: current.id });
    } catch { /* non-blocking */ }
  }

  function handleSubmit() {
    if (sessionInfo) doSubmit(sessionInfo.session_id);
  }

  // Calculer le temps restant pour le chrono
  function getChronoSeconds(): number | null {
    if (!sessionInfo || sessionInfo.time_mode !== "chrono" || !sessionInfo.duration_minutes) return null;
    // On utilise session.started_at stocké localement — on n'a pas started_at ici,
    // donc on stocke le timestamp de démarrage dans localStorage
    const saved = (() => {
      try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "null"); } catch { return null; }
    })();
    const startedAt = saved?.startedAt ? new Date(saved.startedAt) : new Date();
    if (!saved?.startedAt) {
      // Première fois : sauvegarder le timestamp
      const updated = { ...saved, startedAt: startedAt.toISOString() };
      localStorage.setItem(LS_KEY, JSON.stringify(updated));
    }
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const total = sessionInfo.duration_minutes * 60;
    return Math.max(0, total - elapsed);
  }

  if (startError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{startError}</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-blue-600 underline">
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }

  if (loadError) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{loadError}</p>
          <button onClick={() => router.push("/dashboard")} className="mt-4 text-sm text-blue-600 underline">
            Retour au dashboard
          </button>
        </div>
      </main>
    );
  }

  if (!sessionInfo || questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-400">Démarrage du test…</p>
      </main>
    );
  }

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const chronoSeconds = getChronoSeconds();

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header avec countdown si mode chrono */}
        {chronoSeconds !== null && (
          <div className="flex justify-end">
            <Countdown
              totalSeconds={chronoSeconds}
              onExpire={() => doSubmit(sessionInfo.session_id)}
            />
          </div>
        )}

        {/* Deadline warning */}
        {sessionInfo.time_mode === "deadline" && sessionInfo.deadline_at && (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5">
            Deadline : {new Date(sessionInfo.deadline_at).toLocaleString("fr-FR")}
          </div>
        )}

        {/* Progress */}
        <ProgressBar current={index + 1} total={questions.length} />

        {/* Question */}
        <QuestionCard
          question={current}
          selectedAnswer={answers[current.id] ?? null}
          onAnswer={handleAnswer}
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
            onClick={() => { setFeedback(null); if (index > 0) setIndex(index - 1); }}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-40 transition-colors"
          >
            ← Précédent
          </button>

          {!isLast ? (
            <button
              type="button"
              onClick={() => { setFeedback(null); setIndex(index + 1); }}
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

        <p className="text-xs text-center text-gray-400">
          {answeredCount} / {questions.length} réponses enregistrées
        </p>
      </div>
    </main>
  );
}
