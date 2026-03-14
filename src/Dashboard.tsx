import { useEffect, useState } from 'react';
import { supabase } from './supabase';

interface Scan {
  id: string;
  tracking_number: string;
  created_at: string;
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Charger les scans existants
    fetchScans();

    // 2. ÉCOUTER EN TEMPS RÉEL (La magie Supabase)
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
    const { data } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setScans(data);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 flex justify-between items-center">
          Tableau de Bord SCANPRO
          <span className="bg-green-500 text-xs px-3 py-1 rounded-full animate-pulse">LIVE</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm uppercase">Total Scans</p>
            <p className="text-4xl font-black">{scans.length}</p>
          </div>
          {/* Tu pourras ajouter d'autres stats ici */}
        </div>

        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <table className="w-full text-left">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="p-4">Numéro de Suivi</th>
                <th className="p-4">Date & Heure</th>
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition">
                  <td className="p-4 font-mono text-green-400">{scan.tracking_number}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(scan.created_at).toLocaleString('fr-FR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}