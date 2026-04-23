import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";

async function getQuizHistory(userId: number) {
  return sql`
    SELECT
      s.id,
      s.started_at,
      s.submitted_at,
      s.score,
      t.title AS test_title,
      COUNT(a.id)::int AS answer_count
    FROM sessions s
    LEFT JOIN tests t ON t.id = s.test_id
    LEFT JOIN answers a ON a.session_id = s.id
    WHERE s.eleve_id = ${userId} AND s.is_anonymous = FALSE
    GROUP BY s.id, s.started_at, s.submitted_at, s.score, t.title
    ORDER BY s.started_at DESC
    LIMIT 50
  `;
}

async function getMesClasses(userId: number) {
  return sql`
    SELECT
      c.id, c.nom, c.niveau, c.filiere, c.annee_scolaire,
      e.nom AS etablissement_nom,
      ce.status,
      ce.joined_at
    FROM classe_eleves ce
    JOIN classes c ON c.id = ce.classe_id
    LEFT JOIN etablissements e ON e.id = c.etablissement_id
    WHERE ce.eleve_id = ${userId} AND ce.status IN ('active', 'pending')
    ORDER BY ce.joined_at DESC
  `;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Rediriger les enseignants vers leur espace
  if (["enseignant", "admin_ped"].includes(user.role)) {
    redirect("/enseignant/classes");
  }

  const [history, mesClasses] = await Promise.all([
    getQuizHistory(user.id),
    getMesClasses(user.id),
  ]);

  const classesActives = mesClasses.filter((c) => c.status === "active");
  const classesPending = mesClasses.filter((c) => c.status === "pending");

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              Bonjour, {user.first_name ?? user.email} !
            </h1>
            <p className="text-sm text-gray-500">Tableau de bord élève</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/profil"
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2"
            >
              Mon profil
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-lg px-3 py-2"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* ── Mes classes ────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">Mes classes</h2>
            <JoinClasseButton />
          </div>

          {mesClasses.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              Vous n&apos;êtes inscrit à aucune classe.{" "}
              <JoinClasseInline />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Demandes en attente */}
              {classesPending.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl divide-y divide-amber-100">
                  {classesPending.map((c) => (
                    <div key={c.id as number} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.nom as string}</p>
                        <p className="text-xs text-gray-500">
                          {c.niveau as string}{c.filiere ? ` — ${c.filiere}` : ""} · {c.annee_scolaire as string}
                        </p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        En attente
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {/* Classes actives */}
              {classesActives.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                  {classesActives.map((c) => (
                    <div key={c.id as number} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{c.nom as string}</p>
                        <p className="text-xs text-gray-500">
                          {c.niveau as string}{c.filiere ? ` — ${c.filiere}` : ""}
                          {c.etablissement_nom ? ` · ${c.etablissement_nom as string}` : ""}
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">
                        Actif
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* ── Tests assignés ─────────────────────────────────── */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Tests assignés
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
            Aucun test assigné pour le moment.
          </div>
        </section>

        {/* ── Historique sessions autonomes ──────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">
              Historique — sessions autonomes
            </h2>
            <Link
              href="/quiz/select"
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              + Nouveau quiz
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              Vous n&apos;avez pas encore fait de quiz autonome.{" "}
              <Link href="/quiz/select" className="text-blue-600 hover:underline">
                Commencer maintenant
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {history.map((s) => (
                <div
                  key={s.id as number}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(s.test_title as string) ?? "Quiz libre"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(s.started_at as string)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.submitted_at ? (
                      <span className="text-sm font-semibold text-gray-700">
                        Score :{" "}
                        <span className="text-blue-600">{s.score ?? "—"}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-0.5">
                        En cours
                      </span>
                    )}
                    {s.submitted_at && (
                      <Link
                        href={`/quiz/${s.id}/results`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Voir résultats
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ── Composants inline join (client boundary non nécessaire ici,
//    on utilise un simple lien vers la page /classes/join) ──────

function JoinClasseButton() {
  return (
    <Link
      href="/classes/join"
      className="text-sm border border-blue-600 text-blue-600 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
    >
      + Rejoindre une classe
    </Link>
  );
}

function JoinClasseInline() {
  return (
    <Link href="/classes/join" className="text-blue-600 hover:underline">
      Rejoindre une classe
    </Link>
  );
}
