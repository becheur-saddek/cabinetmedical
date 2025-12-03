
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Patients from './components/Patients';
import Prescriptions from './components/Prescriptions';
import Appointments from './components/Appointments';
import Settings from './components/Settings';
import Login from './components/Login';
import Consultations from './components/Consultations';
import Activation from './components/Activation';
import AdminGenerator from './components/AdminGenerator';
import { activationService } from './services/activation';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [canAccess, setCanAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0); // Used to force full app re-render

  useEffect(() => {
    // Initialize Trial Timer
    activationService.initFirstRun();

    // Check Activation Status (Active OR Trial)
    const access = activationService.canAccessApp();
    setCanAccess(access);

    // Check Login Session
    const auth = sessionStorage.getItem('medicab_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);

    // Listen for Soft Reset event from DB service
    const handleReset = () => {
      setResetKey(prev => prev + 1); // This remounts the app
      window.location.hash = '/'; // Go back to dashboard
    };

    window.addEventListener('medicab_reset', handleReset);
    return () => window.removeEventListener('medicab_reset', handleReset);
  }, []);

  const handleLogin = () => {
    sessionStorage.setItem('medicab_auth', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('medicab_auth');
    setIsAuthenticated(false);
  };

  const handleActivationSuccess = () => {
    setCanAccess(true);
  };

  if (loading) return null;

  return (
    <HashRouter key={resetKey}>
      <Routes>
        {/* Secret Admin Route for generating keys */}
        <Route path="/admin-license" element={<AdminGenerator />} />

        {/* Main Application Logic */}
        <Route path="*" element={
          !canAccess ? (
            <Activation onActivate={handleActivationSuccess} />
          ) : !isAuthenticated ? (
            <Login onLogin={handleLogin} />
          ) : (
            <Layout onLogout={handleLogout}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/consultations" element={<Consultations />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/prescriptions" element={<Prescriptions />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          )
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
