import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Questionnaire from './pages/Questionnaire';
import Recommendations from './pages/Recommendations';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <div className="min-h-screen bg-slate-50 pt-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/patient/questionnaire" element={
            <ProtectedRoute allowedRole="patient">
              <Questionnaire />
            </ProtectedRoute>
          } />
          <Route path="/patient/recommendations" element={
            <ProtectedRoute allowedRole="patient">
              <Recommendations />
            </ProtectedRoute>
          } />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
