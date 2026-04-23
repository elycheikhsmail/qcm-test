"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function TokenForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) setToken(urlToken);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/magic-links/${encodeURIComponent(t)}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Lien invalide ou expiré");
        return;
      }
      sessionStorage.setItem("quiz_token", t);
      router.push("/quiz/select");
    } catch {
      setErrorMsg("Erreur réseau. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="ltr">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">QCM Système</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Entrez votre code d&apos;accès pour commencer
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code d&apos;accès
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:outline-none font-mono"
            autoFocus
            autoComplete="off"
          />
          {errorMsg && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}
          <button
            type="submit"
            disabled={!token.trim() || loading}
            className="mt-4 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Vérification…" : "Commencer"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400">
            <span className="bg-gray-50 px-3">ou</span>
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href="/login"
            className="flex-1 text-center py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Se connecter
          </a>
          <a
            href="/signup"
            className="flex-1 text-center py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Créer un compte
          </a>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense>
      <TokenForm />
    </Suspense>
  );
}
