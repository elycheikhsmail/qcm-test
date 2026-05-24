"use client";

import { useState } from "react";

type MagicLinkResult = {
  token: string;
  url: string;
  expires_at: string;
  max_uses: number;
};

export default function AdminPedMagicLinksPage() {
  const [expiresIn, setExpiresIn] = useState(24);
  const [maxUses, setMaxUses] = useState(1);
  const [levelId, setLevelId] = useState("");
  const [classeId, setClasseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MagicLinkResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setResult(null);

    const body: Record<string, number> = {
      expires_in: expiresIn,
      max_uses: maxUses,
    };
    if (levelId.trim()) body.level_id = Number(levelId);
    if (classeId.trim()) body.classe_id = Number(classeId);

    try {
      const res = await fetch("/api/magic-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) {
        setErrorMsg(data.error ?? "Erreur inconnue");
        return;
      }
      setResult(data.data);
    } catch {
      setErrorMsg("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!result) return;
    const fullUrl = `${window.location.origin}/?token=${result.token}`;
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Générer un magic link</h1>

      <form
        onSubmit={handleGenerate}
        className="bg-white border border-gray-200 rounded-xl p-5 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Expiration (heures)</span>
            <input
              type="number"
              min={1}
              max={720}
              value={expiresIn}
              onChange={(e) => setExpiresIn(Number(e.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Utilisations max</span>
            <input
              type="number"
              min={1}
              max={1000}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Niveau (optionnel)</span>
            <input
              type="number"
              placeholder="level_id"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Classe (optionnel)</span>
            <input
              type="number"
              placeholder="classe_id"
              value={classeId}
              onChange={(e) => setClasseId(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Génération…" : "Générer le magic link"}
        </button>
      </form>

      {errorMsg && (
        <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
      )}

      {result && (
        <div
          data-testid="magic-link-result"
          className="mt-6 bg-emerald-50 border border-emerald-200 rounded-xl p-5"
        >
          <p className="text-sm font-medium text-emerald-800 mb-2">Magic link prêt ✓</p>
          <div className="bg-white border border-emerald-200 rounded-lg p-3 mb-3">
            <p className="text-xs text-gray-500 mb-1">URL élève</p>
            <p data-testid="magic-link-url" className="text-sm font-mono text-gray-900 break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/?token=${result.token}`
                : `/?token=${result.token}`}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-emerald-700 mb-3">
            <p>Expire le {new Date(result.expires_at).toLocaleString("fr-FR")}</p>
            <p>Max {result.max_uses} utilisation{result.max_uses > 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="text-sm bg-emerald-600 text-white rounded-lg px-4 py-2 hover:bg-emerald-700"
            >
              {copied ? "Copié !" : "Copier"}
            </button>
            <span data-testid="magic-link-token" className="hidden">
              {result.token}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
