"use client";

import { useEffect, useState, useCallback } from "react";

type Subject = { id: number; name: string; language: string };

export default function MatieresPage() {
  const [items, setItems] = useState<Subject[]>([]);
  const [form, setForm] = useState({ name: "", language: "fr" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", language: "fr" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin-ped/subjects");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name.trim()) return;
    await fetch("/api/admin-ped/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", language: "fr" });
    load();
  }

  async function update(id: number) {
    await fetch(`/api/admin-ped/subjects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditId(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer cette matière ?")) return;
    await fetch(`/api/admin-ped/subjects/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Matières</h1>

      {/* Formulaire création */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3">
        <input
          placeholder="Nom de la matière"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <select
          value={form.language}
          onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="fr">Français</option>
          <option value="ar">Arabe</option>
        </select>
        <button
          onClick={create}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Aucune matière.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Langue</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editId === s.id ? (
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm w-full"
                        />
                      ) : s.name}
                    </td>
                    <td className="px-4 py-3">
                      {editId === s.id ? (
                        <select
                          value={editForm.language}
                          onChange={(e) => setEditForm((f) => ({ ...f, language: e.target.value }))}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        >
                          <option value="fr">fr</option>
                          <option value="ar">ar</option>
                        </select>
                      ) : s.language}
                    </td>
                    <td className="px-4 py-3">
                      {editId === s.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => update(s.id)} className="text-xs text-green-600 hover:underline">Sauver</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:underline">Annuler</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditId(s.id); setEditForm({ name: s.name, language: s.language }); }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Éditer
                          </button>
                          <button onClick={() => remove(s.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
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
