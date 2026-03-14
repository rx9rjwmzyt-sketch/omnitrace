import { useState } from 'react';
import { supabase } from './supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Tentative de connexion via Supabase
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) setError("Email ou mot de passe incorrect.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">OMNI<span className="text-indigo-500">TRACE</span></h1>
          <p className="text-slate-400 text-sm">Portail d'authentification sécurisé</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Email Opérateur</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
              required 
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-3 rounded-lg bg-slate-900 text-white border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20 mt-2"
          >
            {loading ? 'Vérification...' : 'CONNEXION AU SYSTEME'}
          </button>
        </form>
      </div>
    </div>
  );
}