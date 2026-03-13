import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import Terminal from './Terminal';
import Dashboard from './Dashboard';
import Login from './Login';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="bg-slate-900 min-h-screen text-white flex items-center justify-center">Chargement...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Terminal />} />
        <Route path="/login" element={<Login />} />
        
        {/* LE VERROU DU CTO */}
        <Route 
          path="/dashboard" 
          element={session ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        
        {/* LA PREUVE */}
        <Route path="/verif" element={<h1 className="text-white text-3xl p-10">VERROU ACTIF V3</h1>} />
      </Routes>
    </Router>
  );
}

export default App;