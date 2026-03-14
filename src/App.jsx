import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MovieDetail from './pages/MovieDetail';
import MyDiary from './pages/MyDiary';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="min-h-screen bg-cinema-bg">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/diary" element={<MyDiary />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
