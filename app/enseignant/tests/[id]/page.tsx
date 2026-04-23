"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Test = {
  id: number;
  title: string | null;
  time_mode: string;
  duration_minutes: number | null;
  deadline_at: string | null;
  question_count: number;
  difficulty: string | null;
  subject_name: string | null;
  level_name: string | null;
  chapter_title: string | null;
  created_at: string;
  assignments: Assignment[];
};

type Assignment = {
  id: number;
  target_type: "classe" | "eleve";
  target_id: number;
  assigned_at: string;
};

type Classe = { id: number; nom: string; niveau: string };
type Eleve = { id: number; first_name: string | null; last_name: string | null; email: string | null };

function timeModeLabel(mode: string) {
  if (mode === "chrono") return "Chrono";
  if (mode === "deadline") return "Deadline";
  return "Libre";
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [classes, setClasses] = useState<Classe[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [assignTarget, setAssignTarget] = useState<"classe" | "eleve">("classe");
  const [assignId, setAssignId] = useState("");
  const [assignEmail, setAssignEmail] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignSuccess, setAssignSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/tests/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTest(d.data);
        else setError(d.error ?? "Test introuvable");
        setLoading(false);
      })
      .catch(() => { setError("Erreur réseau"); setLoading(false); });

    fetch("/api/classes")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setClasses(d.data); });
  }, [id]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setAssignError("");
    setAssignSuccess("");

    let targetId: number | null = null;

    if (assignTarget === "classe") {
      if (!assignId) { setAssignError("Choisissez une classe"); return; }
      targetId = Number(assignId);
    } else {
      // Rechercher l'élève par email
      if (!assignEmail.trim()) { setAssignError("Email requis"); return; }
      const res = await fetch(`/api/me?email=${encodeURIComponent(assignEmail.trim())}`);
      // On va utiliser une autre approche: récupérer les élèves via GET /api/classes/:id/eleves
      // Pour simplifier, on accepte un ID direct si c'est un nombre
      if (/^\d+$/.test(assignEmail.trim())) {
        targetId = Number(assignEmail.trim());
      } else {
        setAssignError("Veuillez saisir l'ID numérique de l'élève (visible dans son profil)");
        return;
      }
      void res;
    }

    if (!targetId) return;
    setAssigning(true);
    const res = await fetch(`/api/tests/${id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: assignTarget, target_id: targetId }),
    });
    const data = await res.json();
    setAssigning(false);
    if (!data.ok) { setAssignError(data.error); return; }
    setAssignSuccess(data.data?.message ?? "Test assigné avec succès !");
    setAssignId("");
    setAssignEmail("");
    // Recharger le test pour avoir les nouvelles assignations
    fetch(`/api/tests/${id}`).then((r) => r.json()).then((d) => { if (d.ok) setTest(d.data); });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement…</p>
      </main>
    );
  }

  if (error || !test) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-sm">{error || "Test introuvable"}</p>
          <button onClick={() => router.push("/enseignant/tests")} className="mt-4 text-sm text-blue-600 underline">
            Retour
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {test.title ?? `Test #${test.id}`}
            </h1>
            <p className="text-sm text-gray-500">Espace enseignant</p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/enseignant/tests/${id}/results`}
              className="text-sm text-white bg-blue-600 rounded-lg px-3 py-2 hover:bg-blue-700"
            >
              Résultats
            </Link>
            <Link
              href={`/enseignant/tests/${id}/stats`}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Stats
            </Link>
            <Link
              href="/enseignant/tests"
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              ← Mes tests
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Infos test */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Détails</h2>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <dt className="text-gray-400">Matière</dt>
              <dd className="text-gray-900">{test.subject_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Niveau</dt>
              <dd className="text-gray-900">{test.level_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Chapitre</dt>
              <dd className="text-gray-900">{test.chapter_title ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Difficulté</dt>
              <dd className="text-gray-900 capitalize">{test.difficulty ?? "Mixte"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Questions</dt>
              <dd className="text-gray-900">{test.question_count}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Mode temps</dt>
              <dd className="text-gray-900">
                {timeModeLabel(test.time_mode)}
                {test.time_mode === "chrono" && ` — ${test.duration_minutes} min`}
                {test.time_mode === "deadline" && ` — ${formatDate(test.deadline_at)}`}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400">Créé le</dt>
              <dd className="text-gray-900">{formatDate(test.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* Assigner */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Assigner ce test</h2>
          <form onSubmit={handleAssign} className="space-y-4">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={assignTarget === "classe"}
                  onChange={() => setAssignTarget("classe")}
                  className="accent-blue-600"
                />
                À une classe
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  checked={assignTarget === "eleve"}
                  onChange={() => setAssignTarget("eleve")}
                  className="accent-blue-600"
                />
                À un élève
              </label>
            </div>

            {assignTarget === "classe" ? (
              <select
                value={assignId}
                onChange={(e) => setAssignId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Choisir une classe —</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nom} ({c.niveau})</option>
                ))}
              </select>
            ) : (
              <input
                value={assignEmail}
                onChange={(e) => setAssignEmail(e.target.value)}
                placeholder="ID numérique de l'élève"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            )}

            {assignError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{assignError}</p>
            )}
            {assignSuccess && (
              <p className="text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">{assignSuccess}</p>
            )}

            <button
              type="submit"
              disabled={assigning}
              className="text-sm bg-blue-600 text-white rounded-lg px-5 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {assigning ? "Assignation…" : "Assigner"}
            </button>
          </form>
        </div>

        {/* Assignations existantes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Assignations ({test.assignments.length})
          </h2>
          {test.assignments.length === 0 ? (
            <p className="text-sm text-gray-400">Aucune assignation pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {test.assignments.map((a) => (
                <li key={a.id} className="py-2 text-sm flex items-center justify-between">
                  <span className="text-gray-700">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs mr-2 ${
                      a.target_type === "classe"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    }`}>
                      {a.target_type === "classe" ? "Classe" : "Élève"}
                    </span>
                    ID {a.target_id}
                  </span>
                  <span className="text-gray-400 text-xs">{formatDate(a.assigned_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
