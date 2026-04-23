"use client";

import { useEffect, useState, useCallback } from "react";

type Chapter = { id: number; title: string; description: string | null; subject_id: number; level_id: number; subject_name: string; level_name: string };
type Subject = { id: number; name: string };
type Level   = { id: number; name: string };

export default function ChapitresPage() {
  const [items, setItems] = useState<Chapter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [form, setForm] = useState({ title: "", subject_id: "", level_id: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [filterSub, setFilterSub] = useState("");
  const [filterLvl, setFilterLvl] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterSub) params.set("subject_id", filterSub);
    if (filterLvl) params.set("level_id", filterLvl);
    const res = await fetch(`/api/admin-ped/chapters?${params}`);
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, [filterSub, filterLvl]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/admin-ped/subjects").then((r) => r.json()).then((d) => setSubjects(d.data ?? []));
    fetch("/api/admin-ped/levels").then((r) => r.json()).then((d) => setLevels(d.data ?? []));
  }, []);

  async function create() {
    if (!form.title.trim() || !form.subject_id || !form.level_id) return;
    await fetch("/api/admin-ped/chapters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, subject_id: Number(form.subject_id), level_id: Number(form.level_id), description: form.description || undefined }),
    });
    setForm({ title: "", subject_id: "", level_id: "", description: "" });
    load();
  }

  async function update(id: number) {
    await fetch(`/api/admin-ped/chapters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editForm.title, description: editForm.description || undefined }),
    });
    setEditId(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer ce chapitre ?")) return;
    await fetch(`/api/admin-ped/chapters/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Chapitres</h1>

      {/* Création */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Titre du chapitre"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="flex-1 min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <select value={form.subject_id} onChange={(e) => setForm((f) => ({ ...f, subject_id: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Matière</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={form.level_id} onChange={(e) => setForm((f) => ({ ...f, level_id: e.target.value }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Niveau</option>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Ajouter</button>
        </div>
        <input
          placeholder="Description (optionnelle)"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-4">
        <select value={filterSub} onChange={(e) => setFilterSub(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">Toutes les matières</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterLvl} onChange={(e) => setFilterLvl(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
          <option value="">Tous les niveaux</option>
          {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Aucun chapitre.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Titre</th>
                  <th className="px-4 py-3 text-left">Matière</th>
                  <th className="px-4 py-3 text-left">Niveau</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editId === c.id ? (
                        <input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                      ) : c.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.subject_name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.level_name}</td>
                    <td className="px-4 py-3">
                      {editId === c.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => update(c.id)} className="text-xs text-green-600 hover:underline">Sauver</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:underline">Annuler</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditId(c.id); setEditForm({ title: c.title, description: c.description ?? "" }); }} className="text-xs text-blue-600 hover:underline">Éditer</button>
                          <button onClick={() => remove(c.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
