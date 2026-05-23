"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Eleve = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  status: "pending" | "active" | "removed";
  joined_at: string;
};

type Classe = {
  id: number;
  nom: string;
  niveau: string;
  filiere: string | null;
  annee_scolaire: string;
  etablissement_nom: string | null;
  eleves: Eleve[];
};

type MagicLinkResult = {
  token: string;
  url: string;
  expires_at: string;
  max_uses: number;
};

export default function ClasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [classe, setClasse] = useState<Classe | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<number | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [magicLink, setMagicLink] = useState<MagicLinkResult | null>(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlCopied, setMlCopied] = useState(false);

  useEffect(() => {
    fetchClasse();
  }, [id]);

  async function fetchClasse() {
    setLoading(true);
    const res = await fetch(`/api/classes/${id}`);
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403 || res.status === 404) { router.push("/enseignant/classes"); return; }
    const data = await res.json();
    if (data.ok) setClasse(data.data);
    setLoading(false);
  }

  async function handleAccept(eleveId: number) {
    setAccepting(eleveId);
    const res = await fetch(`/api/classes/${id}/eleves/${eleveId}/accept`, { method: "POST" });
    const data = await res.json();
    setAccepting(null);
    if (data.ok) fetchClasse();
  }

  async function handleAddEleve(e: React.FormEvent) {
    e.preventDefault();
    setAddError(""); setAddSuccess("");
    if (!addEmail.trim()) { setAddError("Email requis"); return; }
    setAddLoading(true);
    const res = await fetch(`/api/classes/${id}/eleves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail.trim() }),
    });
    const data = await res.json();
    setAddLoading(false);
    if (!data.ok) { setAddError(data.error); return; }
    const result = data.data.results[0];
    if (result?.status === "added") {
      setAddSuccess(`${addEmail} ajouté avec succès`);
      setAddEmail("");
      fetchClasse();
    } else if (result?.status === "not_found") {
      setAddError("Aucun élève avec cet email");
    } else {
      setAddSuccess(`${addEmail} est déjà dans la classe (statut : ${result?.status})`);
      setAddEmail("");
    }
  }

  async function handleGenerateMagicLink() {
    setMlLoading(true);
    setMagicLink(null);
    const res = await fetch("/api/magic-links/classe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classe_id: parseInt(id), expires_in: 24, max_uses: 100 }),
    });
    const data = await res.json();
    setMlLoading(false);
    if (data.ok) setMagicLink(data.data);
  }

  async function copyMagicLink() {
    if (!magicLink) return;
    const fullUrl = `${window.location.origin}${magicLink.url}`;
    await navigator.clipboard.writeText(fullUrl);
    setMlCopied(true);
    setTimeout(() => setMlCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    );
  }
  if (!classe) return null;

  const actifs = classe.eleves.filter((e) => e.status === "active");
  const pending = classe.eleves.filter((e) => e.status === "pending");

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/enseignant/classes" className="text-sm text-blue-600 hover:underline">
              ← Mes classes
            </Link>
            <h1 className="text-lg font-bold text-gray-900 mt-1">{classe.nom}</h1>
            <p className="text-sm text-gray-500">
              {classe.niveau}{classe.filiere ? ` — ${classe.filiere}` : ""} · {classe.annee_scolaire}
              {classe.etablissement_nom ? ` · ${classe.etablissement_nom}` : ""}
            </p>
          </div>
          <button
            onClick={handleGenerateMagicLink}
            disabled={mlLoading}
            className="text-sm bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            {mlLoading ? "Génération…" : "🔗 Magic link"}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Magic link généré */}
        {magicLink && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800 mb-1">Magic link prêt ✓</p>
              <p className="text-xs text-emerald-700 truncate">
                {`${typeof window !== "undefined" ? window.location.origin : ""}${magicLink.url}`}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Expire dans 24h · max {magicLink.max_uses} utilisations
              </p>
            </div>
            <button
              onClick={copyMagicLink}
              className="shrink-0 text-sm bg-emerald-600 text-white rounded-lg px-3 py-2 hover:bg-emerald-700"
            >
              {mlCopied ? "Copié !" : "Copier"}
            </button>
          </div>
        )}

        {/* Demandes en attente */}
        {pending.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              Demandes en attente
              <span className="bg-amber-100 text-amber-700 text-xs rounded-full px-2 py-0.5">
                {pending.length}
              </span>
            </h2>
            <div className="bg-white rounded-xl border border-amber-200 divide-y divide-gray-100">
              {pending.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {e.first_name ?? ""} {e.last_name ?? ""}
                    </p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                  </div>
                  <button
                    onClick={() => handleAccept(e.id)}
                    disabled={accepting === e.id}
                    className="text-sm bg-blue-600 text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {accepting === e.id ? "…" : "Accepter"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ajouter un élève */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Ajouter un élève</h2>
          <form onSubmit={handleAddEleve} className="flex gap-2">
            <input
              type="email"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={addLoading}
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {addLoading ? "…" : "Ajouter"}
            </button>
          </form>
          {addError && <p className="text-xs text-red-600 mt-2">{addError}</p>}
          {addSuccess && <p className="text-xs text-emerald-600 mt-2">{addSuccess}</p>}
        </section>

        {/* Liste élèves actifs */}
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Élèves actifs ({actifs.length})
          </h2>
          {actifs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
              Aucun élève actif pour le moment.
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {actifs.map((e) => (
                <div key={e.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {e.first_name ?? ""} {e.last_name ?? ""}
                    </p>
                    <p className="text-xs text-gray-400">{e.email}</p>
                  </div>
                  <span className="text-xs text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">
                    Actif
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
