import { useEffect, useState, useMemo } from 'react';
import { supabase } from './supabase';
import { LayoutDashboard, Package, Activity, RefreshCw, Server } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,  
} from 'recharts';

export default function Dashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('logistics_events')
        .select('*')
        .order('timestamp_local', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // --- MOTEUR D'ANALYTIQUE (BI) ---
  // On regroupe les scans par heure pour le graphique
  const hourlyData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // On trie les événements du plus ancien au plus récent pour le graphique
    const sortedEvents = [...events].reverse();
    
    sortedEvents.forEach(event => {
      const date = new Date(event.timestamp_local);
      // On formate l'heure (ex: "14:00")
      const hour = `${date.getHours().toString().padStart(2, '0')}:00`;
      counts[hour] = (counts[hour] || 0) + 1;
    });

    return Object.keys(counts).map(hour => ({
      time: hour,
      scans: counts[hour]
    }));
  }, [events]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-lg shadow-indigo-600/20">
            <LayoutDashboard className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">OMNITRACE ANALYTICS</h1>
            <p className="text-sm text-slate-500 font-medium">Global Command Center • Vue C-Level</p>
          </div>
        </div>
        
        <button 
          onClick={fetchEvents}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all shadow-md"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          {isLoading ? "Sync..." : "Live Update"}
        </button>
      </header>

      {/* KPI CARDS (Les chiffres clés en haut) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-blue-500/10 p-4 rounded-full text-blue-600">
            <Package size={32} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Palettes</p>
            <p className="text-4xl font-black text-slate-800">{events.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-indigo-500/10 p-4 rounded-full text-indigo-600">
            <Activity size={32} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Pic d'Activité</p>
            <p className="text-2xl font-bold text-slate-800">
              {hourlyData.length > 0 ? Math.max(...hourlyData.map(d => d.scans)) : 0} <span className="text-sm text-slate-500 font-medium">scans/heure</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-5">
          <div className="bg-emerald-500/10 p-4 rounded-full text-emerald-600">
            <Server size={32} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Cloud Status</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <p className="text-lg font-bold text-slate-800">PostgreSQL Online</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRAPHIQUE D'ACTIVITÉ */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Flux d'Entrepôt par Heure</h2>
        <div className="h-72 w-full">
          {hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                />
                <Area type="monotone" dataKey="scans" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
              Pas assez de données pour générer le graphique
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU DES DONNÉES BRUTES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Registre Logistique Brut</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-xs uppercase tracking-widest border-b border-slate-200">
                <th className="p-4 font-bold">Palette ID</th>
                <th className="p-4 font-bold">Action</th>
                <th className="p-4 font-bold">Heure Scan (Local)</th>
                <th className="p-4 font-bold">Sync Cloud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {events.slice(0, 10).map((event) => (
                <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-800">{event.pallet_id}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
                      {event.event_type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-sm">
                    {new Date(event.timestamp_local).toLocaleString()}
                  </td>
                  <td className="p-4 text-slate-500 font-mono text-sm">
                    {new Date(event.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {events.length > 10 && (
            <div className="p-4 text-center text-sm font-medium text-slate-400 bg-slate-50 border-t border-slate-100">
              Affichage des 10 derniers événements sur {events.length}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}