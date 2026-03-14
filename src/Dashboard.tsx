import { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Scan {
  id: string;
  tracking_number: string;
  created_at: string;
  scan_type: string; // 👈 NOUVEAUTÉ : On déclare la nouvelle colonne
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScans();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, 
        (payload) => {
          setScans((current) => [payload.new as Scan, ...current]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchScans() {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setScans(data);
    } catch (err: any) {
      console.error("Erreur:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {
    const grouped = scans.reduce((acc, scan) => {
      const date = new Date(scan.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, "Colis": count }))
      .reverse();
  }, [scans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-slate-500">Chargement de l'espace manager...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-red-200 shadow-sm p-8 rounded-xl text-center max-w-lg">
          <p className="text-red-600 font-semibold text-xl mb-2">Erreur de connexion</p>
          <code className="bg-slate-100 p-2 rounded text-slate-600 text-sm block">{error}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête Manager */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supervision Logistique</h1>
            <p className="text-slate-500 mt-1">Vue d'ensemble des flux de numérisation</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-full flex items-center w-fit gap-2 font-medium shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Système synchronisé
          </span>
        </div>

        {/* 📊 LA SECTION DES GRAPHIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Colis Traités</p>
            <p className="text-5xl font-bold text-slate-900">{scans.length}</p>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">Depuis le début de l'activité</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2 h-72 flex flex-col">
            <p className="text-slate-800 font-semibold mb-6">Volume d'activité (7 derniers jours)</p>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }} 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="Colis" fill="#6366f1" maxBarSize={40} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 🗂️ Table des Scans avec NOUVELLE COLONNE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800">Historique récent</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Référence Colis</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type de Flux</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Heure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      Aucune donnée disponible pour le moment.
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => {
                    const dateObj = new Date(scan.created_at);
                    // 👈 NOUVEAUTÉ : Logique d'affichage du badge
                    const isOutbound = scan.scan_type === 'OUTBOUND';

                    return (
                      <tr key={scan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-md text-sm font-mono">
                            {scan.tracking_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isOutbound ? (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1.5 shadow-sm">
                              <span className="text-amber-500">📤</span> Expédition
                            </span>
                          ) : (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-medium flex items-center w-fit gap-1.5 shadow-sm">
                              <span className="text-emerald-500">📥</span> Réception
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                          {dateObj.toLocaleTimeString('fr-FR')}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}