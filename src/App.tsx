import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import Dashboard from './Dashboard';
import Terminal from './Terminal';
import Login from './Login';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'terminal'>('dashboard');

  useEffect(() => {
    // Vérifie s'il y a déjà une session au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Écoute les changements (connexion / déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Si pas connecté = On bloque à la porte avec la page Login !
  if (!session) {
    return <Login />;
  }

  // Si connecté = On affiche l'application avec une barre de navigation
  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-900 text-white p-4 flex flex-col sm:flex-row justify-between items-center border-b border-slate-800 gap-4 shadow-md relative z-10">
        <div className="font-black text-xl tracking-widest">OMNI<span className="text-indigo-500">TRACE</span></div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            📊 Manager
          </button>
          <button 
            onClick={() => setCurrentView('terminal')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentView === 'terminal' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            🔫 Scanner
          </button>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="px-4 py-2 rounded-lg text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 transition-colors ml-4"
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Affichage de la vue sélectionnée */}
      <main>
        {currentView === 'dashboard' ? <Dashboard /> : <Terminal />}
      </main>
    </div>
  );
}