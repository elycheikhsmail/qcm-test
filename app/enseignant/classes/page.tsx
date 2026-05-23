"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Classe = {
  id: number;
  nom: string;
  niveau: string;
  filiere: string | null;
  annee_scolaire: string;
  etablissement_nom: string | null;
  nb_eleves: number;
  nb_pending: number;
};

type Etablissement = { id: number; nom: string; wilaya: string };

export default function EnseignantClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Classe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [nom, setNom] = useState("");
  const [niveau, setNiveau] = useState("");
  const [filiere, setFiliere] = useState("");
  const [annee, setAnnee] = useState("2025-2026");
  const [etablissementId, setEtablissementId] = useState("");

  useEffect(() => {
    fetchClasses();
    fetchEtablissements();
  }, []);

  async function fetchClasses() {
    setLoading(true);
    const res = await fetch("/api/classes");
    if (res.status === 401) { router.push("/login"); return; }
    if (res.status === 403) { router.push("/dashboard"); return; }
    const data = await res.json();
    if (data.ok) setClasses(data.data);
    setLoading(false);
  }

  async function fetchEtablissements() {
    const res = await fetch("/api/etablissements");
    const data = await res.json();
    if (data.ok) setEtablissements(data.data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!nom.trim() || !niveau.trim()) { setFormError("Nom et niveau sont requis"); return; }
    setSubmitting(true);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nom.trim(),
        niveau: niveau.trim(),
        filiere: filiere.trim() || undefined,
        annee_scolaire: annee.trim(),
        etablissement_id: etablissementId ? parseInt(etablissementId) : undefined,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!data.ok) { setFormError(data.error); return; }
    setShowForm(false);
    setNom(""); setNiveau(""); setFiliere(""); setAnnee("2025-2026"); setEtablissementId("");
    fetchClasses();
  }

  const NIVEAUX = ["1AF","2AF","3AF","4AF","5AF","6AF","1AS","2AS","3AS","4AS","5AS","6AS","7AS"];

  return (
    <div>
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Mes classes</h1>
            <p className="text-sm text-gray-500">Espace enseignant</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/enseignant/tests"
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Mes tests
            </a>
            <button
              onClick={() => setShowForm(!showForm)}
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
            >
              + Nouvelle classe
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Formulaire création */}
        {showForm && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold mb-4">Créer une nouvelle classe</h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="ex: 3AS-A Maths"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                <select
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Choisir —</option>
                  {NIVEAUX.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Filière</label>
                <input
                  value={filiere}
                  onChange={(e) => setFiliere(e.target.value)}
                  placeholder="ex: Sciences mathématiques"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Année scolaire</label>
                <input
                  value={annee}
                  onChange={(e) => setAnnee(e.target.value)}
                  placeholder="2025-2026"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Établissement</label>
                <select
                  value={etablissementId}
                  onChange={(e) => setEtablissementId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— Aucun —</option>
                  {etablissements.map((et) => (
                    <option key={et.id} value={et.id}>{et.nom} ({et.wilaya})</option>
                  ))}
                </select>
              </div>
              {formError && (
                <div className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {formError}
                </div>
              )}
              <div className="sm:col-span-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-sm border border-gray-200 rounded-lg px-4 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 disabled:opacity-50"
                >
                  {submitting ? "Création…" : "Créer la classe"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Liste des classes */}
        {loading ? (
          <div className="text-center text-gray-400 py-12 text-sm">Chargement…</div>
        ) : classes.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-sm mb-3">Vous n&apos;avez pas encore de classe.</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-sm bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
            >
              Créer ma première classe
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/enseignant/classes/${c.id}`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.nom}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {c.niveau}{c.filiere ? ` — ${c.filiere}` : ""} · {c.annee_scolaire}
                    </p>
                    {c.etablissement_nom && (
                      <p className="text-xs text-gray-400 mt-1">{c.etablissement_nom}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-medium text-gray-700">{c.nb_eleves} élève{c.nb_eleves !== 1 ? "s" : ""}</p>
                    {c.nb_pending > 0 && (
                      <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                        {c.nb_pending} en attente
                      </span>
                    )}
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
