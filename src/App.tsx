import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { SuperAdminPanel } from './pages/SuperAdminPanel';
import { BarPOS } from './pages/BarPOS';
import { FutbolPanel } from './pages/FutbolPanel';
import { BasquetPanel } from './pages/BasquetPanel';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SuperAdminPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/bar" element={
            <ProtectedRoute allowedRoles={['superadmin', 'barista']}>
              <BarPOS />
            </ProtectedRoute>
          } />
          
          <Route path="/futbol" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin_futbol']}>
              <FutbolPanel />
            </ProtectedRoute>
          } />
          
          <Route path="/basquet" element={
            <ProtectedRoute allowedRoles={['superadmin', 'admin_basquet']}>
              <BasquetPanel />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
