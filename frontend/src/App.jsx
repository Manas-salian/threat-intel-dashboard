import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Home, Shield, Users, Target, Database, BarChart3, Upload, Search, Settings, Sun, Moon, Globe } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Dashboard from './pages/Dashboard';
import Indicators from './pages/Indicators';
import ThreatActors from './pages/ThreatActors';
import Campaigns from './pages/Campaigns';
import Sources from './pages/Sources';
import Analytics from './pages/Analytics';
import Ingestion from './pages/Ingestion';
import ThreatCheck from './pages/ThreatCheck';
import Admin from './pages/Admin';
import DataExplorer from './pages/DataExplorer';
import './App.css';

function NavLink({ to, icon: Icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <li>
      <Link to={to} className={`nav-link ${isActive ? 'active' : ''}`}>
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    </li>
  );
}

function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="sidebar-header">
          <Shield className="logo-icon" size={32} />
          <h1 className="logo-text">Threat Intel</h1>
        </div>

        <ul className="nav-menu">
          <NavLink to="/" icon={Home} label="Dashboard" />
          <NavLink to="/explorer" icon={Globe} label="Data Explorer" />

          <li className="nav-section">Analysis</li>
          <NavLink to="/check" icon={Search} label="Threat Check" />
          <NavLink to="/indicators" icon={Shield} label="Indicators" />
          <NavLink to="/actors" icon={Users} label="Threat Actors" />
          <NavLink to="/campaigns" icon={Target} label="Campaigns" />

          <li className="nav-section">Data</li>
          <NavLink to="/sources" icon={Database} label="Sources" />
          <NavLink to="/analytics" icon={BarChart3} label="Analytics" />
          <NavLink to="/ingestion" icon={Upload} label="Ingestion" />

          <li className="nav-section">System</li>
          <NavLink to="/admin" icon={Settings} label="Admin" />
        </ul>

        <div className="theme-toggle">
          <span>Theme</span>
          <button className="btn" onClick={toggleTheme} style={{ background: 'transparent', padding: 0 }}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/explorer" element={<DataExplorer />} />
          <Route path="/check" element={<ThreatCheck />} />
          <Route path="/indicators" element={<Indicators />} />
          <Route path="/actors" element={<ThreatActors />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/sources" element={<Sources />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ingestion" element={<Ingestion />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout />
      </Router>
    </ThemeProvider>
  );
}

export default App;
