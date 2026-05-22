"use client";

import { useEffect, useState, useCallback } from "react";

type Cycle   = "fondamental" | "college" | "lycee";
type Branche = "C" | "D" | "A" | "O";
type Level   = { id: number; name: string; order: number | null; cycle: Cycle; branche: Branche | null };

const CYCLES: { key: Cycle; label: string; color: string }[] = [
  { key: "fondamental", label: "Fondamental", color: "bg-green-100 text-green-800" },
  { key: "college",     label: "Collège",      color: "bg-blue-100 text-blue-800" },
  { key: "lycee",       label: "Lycée",        color: "bg-purple-100 text-purple-800" },
];

const BRANCHES: { key: Branche; label: string }[] = [
  { key: "C", label: "C — Mathématiques" },
  { key: "D", label: "D — Sciences Naturelles" },
  { key: "A", label: "A — Littérature Moderne" },
  { key: "O", label: "O — Littérature Originelle" },
];

const BRANCHE_BADGE: Record<Branche, string> = {
  C: "bg-orange-100 text-orange-700",
  D: "bg-teal-100 text-teal-700",
  A: "bg-rose-100 text-rose-700",
  O: "bg-amber-100 text-amber-700",
};

export default function NiveauxPage() {
  const [items, setItems]       = useState<Level[]>([]);
  const [form, setForm]         = useState({ name: "", order: "", cycle: "" as Cycle | "", branche: "" as Branche | "" });
  const [editId, setEditId]     = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", order: "", cycle: "" as Cycle | "", branche: "" as Branche | "" });
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/admin-ped/levels");
    const data = await res.json();
    setItems(data.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name.trim() || !form.cycle) return;
    await fetch("/api/admin-ped/levels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:    form.name,
        order:   form.order ? Number(form.order) : undefined,
        cycle:   form.cycle,
        branche: form.cycle === "lycee" && form.branche ? form.branche : undefined,
      }),
    });
    setForm({ name: "", order: "", cycle: "", branche: "" });
    load();
  }

  async function update(id: number) {
    const payload: Record<string, unknown> = {
      name:  editForm.name,
      order: editForm.order ? Number(editForm.order) : undefined,
      cycle: editForm.cycle || undefined,
    };
    if (editForm.cycle === "lycee") {
      payload.branche = editForm.branche || null;
    } else {
      payload.branche = null;
    }
    await fetch(`/api/admin-ped/levels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setEditId(null);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Supprimer ce niveau ?")) return;
    await fetch(`/api/admin-ped/levels/${id}`, { method: "DELETE" });
    load();
  }

  function bycycle(cycle: Cycle) { return items.filter((l) => l.cycle === cycle); }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-bold text-gray-900 mb-6">Niveaux</h1>

      {/* Formulaire d'ajout */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8">
        <p className="text-sm font-medium text-gray-700 mb-3">Ajouter un niveau</p>
        <div className="flex gap-3 flex-wrap">
          <input
            placeholder="Ex : 6AS"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex-1 min-w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <input
            placeholder="Ordre"
            type="number"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <select
            value={form.cycle}
            onChange={(e) => setForm((f) => ({ ...f, cycle: e.target.value as Cycle, branche: "" }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Cycle —</option>
            {CYCLES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          {form.cycle === "lycee" && (
            <select
              value={form.branche}
              onChange={(e) => setForm((f) => ({ ...f, branche: e.target.value as Branche }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">— Série —</option>
              {BRANCHES.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          )}
          <button
            onClick={create}
            disabled={!form.name.trim() || !form.cycle}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Ajouter
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="space-y-6">
          {CYCLES.map(({ key, label, color }) => (
            <div key={key}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${color}`}>{label}</span>
                <span className="text-xs text-gray-400">{bycycle(key).length} niveau{bycycle(key).length !== 1 ? "x" : ""}</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {bycycle(key).length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400 italic">Aucun niveau dans ce cycle.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2 text-left">Nom</th>
                        <th className="px-4 py-2 text-left">Ordre</th>
                        {key === "lycee" && <th className="px-4 py-2 text-left">Série</th>}
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bycycle(key).map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {editId === l.id
                              ? <input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                              : l.name}
                          </td>
                          <td className="px-4 py-3">
                            {editId === l.id
                              ? <input type="number" value={editForm.order} onChange={(e) => setEditForm((f) => ({ ...f, order: e.target.value }))} className="border border-gray-300 rounded px-2 py-1 text-sm w-16" />
                              : (l.order ?? "—")}
                          </td>
                          {key === "lycee" && (
                            <td className="px-4 py-3">
                              {editId === l.id ? (
                                <select
                                  value={editForm.branche}
                                  onChange={(e) => setEditForm((f) => ({ ...f, branche: e.target.value as Branche | "" }))}
                                  className="border border-gray-300 rounded px-2 py-1 text-xs"
                                >
                                  <option value="">— aucune —</option>
                                  {BRANCHES.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                                </select>
                              ) : l.branche ? (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BRANCHE_BADGE[l.branche]}`}>
                                  {l.branche} — {BRANCHES.find((b) => b.key === l.branche)?.label.split(" — ")[1]}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 italic">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            {editId === l.id ? (
                              <div className="flex gap-2">
                                <button onClick={() => update(l.id)} className="text-xs text-green-600 hover:underline">Sauver</button>
                                <button onClick={() => setEditId(null)} className="text-xs text-gray-500 hover:underline">Annuler</button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditId(l.id);
                                    setEditForm({ name: l.name, order: String(l.order ?? ""), cycle: l.cycle, branche: l.branche ?? "" });
                                  }}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Éditer
                                </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
