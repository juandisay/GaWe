import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { listen } from '@tauri-apps/api/event';
import { Home } from './pages/Home';
import { Config } from './pages/Config';
import { Focus } from './pages/Focus';
import { Settings } from './pages/Settings';
import { useSessionStore } from './stores/sessionStore';
import './index.css';

function App() {
  const { loadSessions } = useSessionStore();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const unlisten = listen('activity-warning', () => {
      // In-app notification could go here
      console.log('User is idle! Focus reminder sent.');
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/config" element={<Config />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
