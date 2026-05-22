"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Question = {
  id: number;
  content: string;
  type: string;
  difficulty: string;
  validated: boolean;
  created_at: string;
  chapter_title: string;
  subject_name: string;
  level_name: string;
};

type Filters = {
  subject_id: string;
  level_id: string;
  chapter_id: string;
  validated: string;
};

type Subject = { id: number; name: string };
type Level = { id: number; name: string };
type Chapter = { id: number; title: string };

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({ subject_id: "", level_id: "", chapter_id: "", validated: "false" });
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    fetch("/api/admin-ped/subjects").then(r => r.json()).then(d => setSubjects(d.data ?? []));
    fetch("/api/admin-ped/levels").then(r => r.json()).then(d => setLevels(d.data ?? []));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.subject_id) params.set("subject_id", filters.subject_id);
    if (filters.level_id) params.set("level_id", filters.level_id);
    fetch(`/api/admin-ped/chapters?${params}`).then(r => r.json()).then(d => {
      setChapters(d.data ?? []);
      setFilters(f => ({ ...f, chapter_id: "" }));
    });
  }, [filters.subject_id, filters.level_id]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.subject_id) params.set("subject_id", filters.subject_id);
    if (filters.level_id) params.set("level_id", filters.level_id);
    if (filters.chapter_id) params.set("chapter_id", filters.chapter_id);
    if (filters.validated) params.set("validated", filters.validated);
    const res = await fetch(`/api/admin-ped/questions?${params}`);
    const data = await res.json();
    setQuestions(data.data ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setActionLoading(id);
    await fetch(`/api/admin-ped/questions/${id}/approve`, { method: "POST" });
    setActionLoading(null);
    load();
  }

  async function reject(id: number) {
    if (!confirm("Supprimer définitivement cette question ?")) return;
    setActionLoading(id);
    await fetch(`/api/admin-ped/questions/${id}/reject`, { method: "POST" });
    setActionLoading(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Questions</h1>
        <span className="text-sm text-gray-500">{questions.length} résultats</span>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <select
          value={filters.subject_id}
          onChange={(e) => setFilters((f) => ({ ...f, subject_id: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Toutes les matières</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filters.level_id}
          onChange={(e) => setFilters((f) => ({ ...f, level_id: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tous les niveaux</option>
          {levels.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
        <select
          value={filters.chapter_id}
          onChange={(e) => setFilters((f) => ({ ...f, chapter_id: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Tous les chapitres</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select
          value={filters.validated}
          onChange={(e) => setFilters((f) => ({ ...f, validated: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">Toutes</option>
          <option value="false">En attente</option>
          <option value="true">Approuvées</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune question.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Contenu</th>
                <th className="px-4 py-3 text-left">Chapitre</th>
                <th className="px-4 py-3 text-left">Difficulté</th>
                <th className="px-4 py-3 text-left">Statut</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate">{q.content}</p>
                    <p className="text-xs text-gray-400">{q.subject_name} · {q.level_name}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{q.chapter_title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.difficulty === "facile" ? "bg-green-100 text-green-700" :
                      q.difficulty === "moyen" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{q.difficulty}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      q.validated ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    }`}>{q.validated ? "Approuvée" : "Pending"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin-ped/questions/${q.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Éditer
                      </Link>
                      {!q.validated && (
                        <button
                          onClick={() => approve(q.id)}
                          disabled={actionLoading === q.id}
                          className="text-xs text-green-600 hover:underline disabled:opacity-50"
                        >
                          Approuver
                        </button>
                      )}
                      <button
                        onClick={() => reject(q.id)}
                        disabled={actionLoading === q.id}
                        className="text-xs text-red-600 hover:underline disabled:opacity-50"
                      >
                        Rejeter
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
