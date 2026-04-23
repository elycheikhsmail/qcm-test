"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("@/components/directeur/LineChart"), { ssr: false });

type BySubject = Record<string, { semaine: string; moyenne: number }[]>;

export default function EleveEvolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [bySubject, setBySubject] = useState<BySubject | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/directeur/eleves/${id}/evolution`)
      .then((r) => r.json())
      .then((d) => { setBySubject(d.data); setLoading(false); });
  }, [id]);

  const series = bySubject
    ? Object.entries(bySubject).map(([label, points]) => ({ label, points }))
    : [];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← Profil élève</button>
        <h1 className="text-lg font-bold text-gray-900">Évolution — 12 dernières semaines</h1>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-xs text-gray-400 mb-4">Moyenne /20 par matière, agrégée par semaine</p>
          <LineChart series={series} />
        </div>
      )}
    </div>
  );
}
