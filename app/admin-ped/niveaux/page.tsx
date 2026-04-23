"use client";

import { useEffect, useState, useCallback } from "react";

type Level = { id: number; name: string; order: number | null };

export default function NiveauxPage() {
  const [items, setItems] = useState<Level[]>([]);
  const [form, setForm] = useState({ name: "", order: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", order: "" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin-ped/levels");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name.trim()) return;
    await fetch("/api/admin-ped/levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, order: form.order ? Number(form.order) : undefined }),
    });
    setForm({ name: "", order: "" });
    load();
  }

  async function update(id: number) {
    await fetch(`/api/admin-ped/levels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editForm.name, order: editForm.order ? Number(editForm.order) : undefined }),
    });
    setEditId(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer ce niveau ?")) return;
    await fetch(`/api/admin-ped/levels/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Niveaux</h1>

      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3">
        <input
          placeholder="Ex : 3ème"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <input
          placeholder="Ordre"
          type="number"
          value={form.order}
          onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button onClick={create} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Ajouter
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {items.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Aucun niveau.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Nom</th>
                  <th className="px-4 py-3 text-left">Ordre</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {editId === l.id ? (
                        <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                      ) : l.name}
                    </td>
                    <td className="px-4 py-3">
                      {editId === l.id ? (
                        <input type="number" value={editForm.order} onChange={(e) => setEditForm((f) => ({ ...f, order: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-16" />
                      ) : (l.order ?? "—")}
                    </td>
                    <td className="px-4 py-3">
                      {editId === l.id ? (
                        <div className="flex gap-2">
                          <button onClick={() => update(l.id)} className="text-xs text-green-600 hover:underline">Sauver</button>
                          <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:underline">Annuler</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditId(l.id); setEditForm({ name: l.name, order: String(l.order ?? "") }); }} className="text-xs text-blue-600 hover:underline">Éditer</button>
                          <button onClick={() => remove(l.id)} className="text-xs text-red-600 hover:underline">Supprimer</button>
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
