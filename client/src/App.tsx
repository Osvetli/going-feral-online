import { BrowserRouter, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import InputPage from './pages/InputPage';
import PhysicsPage from './pages/PhysicsPage';
import GachaPage from './pages/GachaPage';
import CollectionPage from './pages/CollectionPage';
import SharePage from './pages/SharePage';
import LoginGate from './components/LoginGate';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-dark-bg">
        <NavBar />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/input" element={<LoginGate><InputPage /></LoginGate>} />
            <Route path="/physics" element={<LoginGate><PhysicsPage /></LoginGate>} />
            <Route path="/gacha" element={<LoginGate><GachaPage /></LoginGate>} />
            <Route path="/collection" element={<LoginGate><CollectionPage /></LoginGate>} />
            <Route path="/share/:id" element={<SharePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
