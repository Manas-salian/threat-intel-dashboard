import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home, Shield, Users, Target, Database, BarChart3, Upload } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Indicators from './pages/Indicators';
import ThreatActors from './pages/ThreatActors';
import Campaigns from './pages/Campaigns';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';
import Ingestion from './pages/Ingestion';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="sidebar">
          <div className="sidebar-header">
            <Shield className="logo-icon" size={32} />
            <h1 className="logo-text">Threat Intel</h1>
          </div>
          
          <ul className="nav-menu">
            <li>
              <Link to="/" className="nav-link">
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link to="/indicators" className="nav-link">
                <Shield size={20} />
                <span>Indicators</span>
              </Link>
            </li>
            <li>
              <Link to="/actors" className="nav-link">
                <Users size={20} />
                <span>Threat Actors</span>
              </Link>
            </li>
            <li>
              <Link to="/campaigns" className="nav-link">
                <Target size={20} />
                <span>Campaigns</span>
              </Link>
            </li>
            <li>
              <Link to="/sources" className="nav-link">
                <Database size={20} />
                <span>Sources</span>
              </Link>
            </li>
            <li>
              <Link to="/analytics" className="nav-link">
                <BarChart3 size={20} />
                <span>Analytics</span>
              </Link>
            </li>
            <li>
              <Link to="/ingestion" className="nav-link">
                <Upload size={20} />
                <span>Ingestion</span>
              </Link>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/indicators" element={<Indicators />} />
            <Route path="/actors" element={<ThreatActors />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/sources" element={<Sources />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ingestion" element={<Ingestion />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
