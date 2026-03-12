import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Terminal from './Terminal';
import Dashboard from './Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Terminal />} />
        <Route path="/admin" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}