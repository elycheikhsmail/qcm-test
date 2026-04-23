"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: number;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ first_name: "", last_name: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => {
        if (r.status === 401) { router.push("/login"); return null; }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setUser(d.data);
        setForm({
          first_name: d.data.first_name ?? "",
          last_name: d.data.last_name ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setMessage({ type: "err", text: "Prénom et nom sont obligatoires" });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error ?? "Erreur lors de la sauvegarde" });
      } else {
        setMessage({ type: "ok", text: "Profil mis à jour !" });
        setUser(data.data);
      }
    } catch {
      setMessage({ type: "err", text: "Erreur réseau." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Chargement…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
            ← Tableau de bord
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-900">Mon profil</span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
            <p className="text-sm text-gray-700 mt-1">{user?.email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  name="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={onChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  name="last_name"
                  type="text"
                  value={form.last_name}
                  onChange={onChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {message && (
              <p
                className={`text-sm rounded-lg px-3 py-2 ${
                  message.type === "ok"
                    ? "text-green-700 bg-green-50"
                    : "text-red-600 bg-red-50"
                }`}
              >
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Sauvegarde…" : "Enregistrer"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
