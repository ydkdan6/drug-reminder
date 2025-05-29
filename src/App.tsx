import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useReminderService } from './services/reminderService';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MedicationList from './pages/MedicationList';
import AddMedication from './pages/AddMedication';
import EditMedication from './pages/EditMedication';
import Profile from './pages/Profile';
import Settings from './pages/Settings';


// Components
import Layout from './components/Layout';

// Store
import { useAuthStore } from './store/authStore';

// Config
import { initEmailJS } from './config/emailjs';

// Initialize EmailJS
initEmailJS();

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { getUser } = useAuthStore();

  useReminderService();
  
  useEffect(() => {
    getUser();
  }, [getUser]);

  return (
    <>
      <Router>
        <Layout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medications" 
              element={
                <ProtectedRoute>
                  <MedicationList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medications/add" 
              element={
                <ProtectedRoute>
                  <AddMedication />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/medications/edit/:id" 
              element={
                <ProtectedRoute>
                  <EditMedication />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>
        </Layout>
      </Router>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
}

export default App;