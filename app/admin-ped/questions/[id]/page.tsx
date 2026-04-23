"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

type Question = {
  id: number;
  content: string;
  type: string;
  difficulty: string;
  options: unknown;
  correct_answer: unknown;
  validated: boolean;
  chapter_id: number;
  chapter_title: string;
  subject_name: string;
  level_name: string;
};

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [q, setQ] = useState<Question | null>(null);
  const [form, setForm] = useState({ content: "", difficulty: "moyen", options: "", correct_answer: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/admin-ped/questions/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const q = d.data;
        setQ(q);
        setForm({
          content: q.content,
          difficulty: q.difficulty,
          options: JSON.stringify(q.options, null, 2),
          correct_answer: JSON.stringify(q.correct_answer, null, 2),
        });
      });
  }, [id]);

  async function save() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin-ped/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: form.content,
          difficulty: form.difficulty,
          options: JSON.parse(form.options),
          correct_answer: JSON.parse(form.correct_answer),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      router.push("/admin-ped/questions");
    } catch (e) {
      setError("JSON invalide dans options ou correct_answer");
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    await fetch(`/api/admin-ped/questions/${id}/approve`, { method: "POST" });
    router.push("/admin-ped/questions");
  }

  if (!q) return <p className="text-sm text-gray-500">Chargement…</p>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Retour</button>
        <h1 className="text-lg font-bold text-gray-900">Éditer la question #{id}</h1>
        <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${q.validated ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
          {q.validated ? "Approuvée" : "Pending"}
        </span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <p className="text-xs text-gray-500">{q.subject_name} · {q.level_name} · {q.chapter_title}</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu</label>
          <textarea
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulté</label>
          <select
            value={form.difficulty}
            onChange={(e) => setForm((f) => ({ ...f, difficulty: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="facile">Facile</option>
            <option value="moyen">Moyen</option>
            <option value="difficile">Difficile</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Options (JSON)</label>
          <textarea
            value={form.options}
            onChange={(e) => setForm((f) => ({ ...f, options: e.target.value }))}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bonne réponse (JSON)</label>
          <textarea
            value={form.correct_answer}
            onChange={(e) => setForm((f) => ({ ...f, correct_answer: e.target.value }))}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {!q.validated && (
            <button
              onClick={approve}
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Approuver
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
