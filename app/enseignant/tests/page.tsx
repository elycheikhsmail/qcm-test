"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  nb_assignments: number;
  created_at: string;
};

function timeModeLabel(mode: string, dur: number | null, dl: string | null) {
  if (mode === "chrono") return `Chrono ${dur}min`;
  if (mode === "deadline" && dl) {
    const d = new Date(dl);
    return `Deadline ${d.toLocaleDateString("fr-FR")}`;
  }
  return "Libre";
}

export default function EnseignantTestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tests")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setTests(d.data);
        else if (d.error === "Non authentifié") router.push("/login");
        else if (d.error?.includes("enseignants")) router.push("/dashboard");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mes tests</h1>
            <p className="text-sm text-gray-500">Espace enseignant</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/enseignant/classes"
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Mes classes
            </Link>
            <Link
              href="/enseignant/tests/new"
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              + Nouveau test
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <p className="text-center text-gray-400 text-sm py-12">Chargement…</p>
        ) : tests.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm mb-3">Vous n&apos;avez pas encore créé de test.</p>
            <Link
              href="/enseignant/tests/new"
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 inline-block"
            >
              Créer mon premier test
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tests.map((t) => (
              <Link
                key={t.id}
                href={`/enseignant/tests/${t.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {t.title ?? `Test #${t.id}`}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {[t.subject_name, t.level_name].filter(Boolean).join(" · ") || "Tous niveaux"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t.question_count} questions · {t.difficulty ?? "mixte"} · {timeModeLabel(t.time_mode, t.duration_minutes, t.deadline_at)}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {t.nb_assignments} assignation{t.nb_assignments !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
