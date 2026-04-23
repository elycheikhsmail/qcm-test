"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function JoinClassePage() {
  const router = useRouter();
  const [classeId, setClasseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    const id = parseInt(classeId.trim(), 10);
    if (isNaN(id) || id <= 0) { setError("Identifiant de classe invalide"); return; }
    setLoading(true);
    const res = await fetch(`/api/classes/${id}/join`, { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) { setError(data.error); return; }
    setSuccess("Demande envoyée ! L'enseignant doit valider votre adhésion.");
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-gray-200 p-8 space-y-6">
        <div>
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-3">Rejoindre une classe</h1>
          <p className="text-sm text-gray-500 mt-1">
            Entrez l&apos;identifiant de la classe fourni par votre enseignant.
          </p>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifiant de la classe
            </label>
            <input
              type="number"
              min="1"
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              placeholder="ex: 42"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Envoi de la demande…" : "Envoyer la demande"}
          </button>
        </form>
      </div>
    </main>
  );
}
