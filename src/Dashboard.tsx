import React, { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { useNavigate } from 'react-router-dom';

// Typage strict
interface Scan {
  id: number;
  tracking_number: string;
  created_at: string;
}

export default function Dashboard() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // NOUVEAU : État d'erreur
  const navigate = useNavigate();

  const fetchScans = async () => {
    setLoading(true);
    setError(null); // On réinitialise l'erreur à chaque essai
    
    try {
      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // FIX SENIOR : On limite aux 100 derniers pour éviter le crash mémoire

      if (error) throw error;
      setScans(data || []);
    } catch (err: any) {
      console.error("Erreur Fetch:", err);
      setError("Impossible de charger les données logistiques. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. On charge les données au démarrage
    fetchScans();

    // 2. FIX SENIOR : Écoute en TEMPS RÉEL des nouveaux scans !
    const subscription = supabase
      .channel('scans-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, (payload) => {
        // Magie : On ajoute le nouveau scan tout en haut de la liste sans recharger !
        setScans((currentScans) => [payload.new as Scan, ...currentScans].slice(0, 100));
      })
      .subscribe();

    // Nettoyage pour éviter les fuites de mémoire (Memory Leak)
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(dateString));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* EN-TÊTE */}
        <header className="flex justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-wider">
              OMNI<span className="text-blue-500">TRACE</span> ADMIN
            </h1>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Connecté en Temps Réel
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-all active:scale-95 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
          >
            VERROUILLER LA SESSION
          </button>
        </header>

        {/* NOUVEAU : BANNIÈRE D'ERREUR UI */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg flex items-center gap-3 animate-pulse">
            <span>⚠️</span>
            <p className="font-semibold">{error}</p>
            <button onClick={fetchScans} className="ml-auto underline hover:text-white">Réessayer</button>
          </div>
        )}

        {/* STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md">
            <h3 className="text-slate-400 text-sm font-semibold uppercase mb-2">Scans Récents</h3>
            <p className="text-4xl font-bold text-blue-400">{scans.length}</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md opacity-50">
            <h3 className="text-slate-400 text-sm font-semibold uppercase mb-2">Taux d'Activité</h3>
            <p className="text-4xl font-bold text-slate-300">En direct</p>
          </div>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-md opacity-50">
            <h3 className="text-slate-400 text-sm font-semibold uppercase mb-2">Statut Serveur</h3>
            <p className="text-4xl font-bold text-emerald-400">Opérationnel</p>
          </div>
        </div>

        {/* TABLEAU DES DONNÉES */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Flux Logistique</h2>
            <span className="text-xs bg-slate-700 text-slate-300 px-3 py-1 rounded-full">Affichage des 100 derniers</span>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p>Synchronisation avec la base de données...</p>
              </div>
            ) : scans.length === 0 && !error ? (
              <div className="p-12 text-center text-slate-500 font-mono">
                En attente du premier scan opérateur...
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">ID Opération</th>
                    <th className="px-6 py-4">Code-barres</th>
                    <th className="px-6 py-4">Horodatage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-slate-700/40 transition-colors group">
                      <td className="px-6 py-4 text-slate-500 font-mono text-sm group-hover:text-blue-400 transition-colors">#{scan.id}</td>
                      <td className="px-6 py-4 text-white font-mono font-bold tracking-wider text-lg">{scan.tracking_number}</td>
                      <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(scan.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}