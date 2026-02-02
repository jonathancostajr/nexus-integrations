import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Squads } from './pages/Squads';
import { Projects } from './pages/Projects';
import { Integrations } from './pages/Integrations';
import { AuthCallback } from './pages/AuthCallback';
import { IntegrationsCallback } from './pages/IntegrationsCallback';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('nexus_user') !== null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/integrations/callback" element={<IntegrationsCallback />} />

        {/* Protected Routes inside Layout */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/squads" element={<Squads />} />
          <Route path="/squads/:squadId/projects" element={<Projects />} />
          <Route path="/squads/:squadId/projects/:projectId/integrations" element={<Integrations />} />
        </Route>

        <Route path="/" element={<Navigate to="/squads" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;