import { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface Scan {
  id: string;
  tracking_number: string;
  created_at: string;
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

  // 🧠 LE CERVEAU DU GRAPHIQUE : Trie les scans par jour automatiquement
  const chartData = useMemo(() => {
    const grouped = scans.reduce((acc, scan) => {
      // Extrait juste la date (ex: "14 mars")
      const date = new Date(scan.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transforme pour le graphique et inverse pour avoir l'ordre chronologique
    return Object.entries(grouped)
      .map(([date, count]) => ({ date, "Colis": count }))
      .reverse();
  }, [scans]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl font-bold animate-pulse text-slate-300">Connexion au serveur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-4">
        <div className="bg-red-500/10 border border-red-500 p-8 rounded-xl text-center max-w-lg">
          <p className="text-red-500 font-bold text-2xl mb-4">Alerte Serveur 🚨</p>
          <code className="bg-black/50 p-2 rounded text-red-400 text-sm block">{error}</code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          Tableau de Bord SCANPRO
          <span className="bg-green-500/20 text-green-400 border border-green-500/50 text-xs px-4 py-1.5 rounded-full animate-pulse flex items-center w-fit gap-2 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            CONNEXION LIVE ACTIVE
          </span>
        </h1>

        {/* 📊 LA SECTION DES GRAPHIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Compteur Total */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <p className="text-slate-400 text-sm uppercase font-semibold tracking-wider mb-2">Total Colis</p>
            <p className="text-6xl font-black text-white">{scans.length}</p>
          </div>
          
          {/* Le Graphique (Prend 2 colonnes) */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg md:col-span-2 h-64 flex flex-col">
            <p className="text-slate-400 text-sm uppercase font-semibold tracking-wider mb-4">Activité des 7 derniers jours</p>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#334155' }} 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="Colis" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
        </div>

        {/* Table des Scans (inchangée) */}
        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/80">
                <tr>
                  <th className="p-5 font-semibold text-slate-300">Numéro de Suivi</th>
                  <th className="p-5 font-semibold text-slate-300">Date du Scan</th>
                  <th className="p-5 font-semibold text-slate-300">Heure</th>
                </tr>
              </thead>
              <tbody>
                {scans.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-10 text-center text-slate-400 italic">
                      La base de données est vide. Scannez un colis pour voir la magie opérer ! 📦✨
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => {
                    const dateObj = new Date(scan.created_at);
                    return (
                      <tr key={scan.id} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="p-5 font-mono">
                          <span className="bg-green-400/10 text-green-400 px-3 py-1.5 rounded-md text-sm border border-green-400/20 shadow-sm">
                            {scan.tracking_number}
                          </span>
                        </td>
                        <td className="p-5 text-slate-300">
                          {dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-5 text-slate-400 font-mono text-sm">
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