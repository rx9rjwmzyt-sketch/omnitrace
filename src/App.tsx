import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Terminal from './Terminal';
import Dashboard from './Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* La page d'accueil (Scanner) */}
        <Route path="/" element={<Terminal />} />
        
        {/* LA PIÈCE MANQUANTE : Le Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;