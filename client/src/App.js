import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import FacebookIntegration from './pages/FacebookIntegration';
import { useEffect } from 'react';
import axios from 'axios';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

function RequireFbPage({ children }) {
  const { token } = useAuth();
  const [checked, setChecked] = React.useState(false);
  const [hasPage, setHasPage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function checkFbPage() {
      if (!token) {
        setChecked(true);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/facebook/connect', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.fbPage && res.data.fbPage.id) {
          setHasPage(true);
        } else {
          setHasPage(false);
        }
      } catch (err) {
        console.error('Error checking FB page connection:', err);
        setHasPage(false);
      } finally {
        setChecked(true);
        setLoading(false);
      }
    }
    checkFbPage();
    // eslint-disable-next-line
  }, [token]);

  if (loading || !checked) {
    return null;
  }

  return hasPage ? children : <Navigate to="/facebook-integration" replace />;
}

function RedirectToFbIntegration() {
  const { token } = useAuth();
  const [checked, setChecked] = React.useState(false);
  // eslint-disable-next-line
  const [hasPage, setHasPage] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    async function checkAndRedirect() {
      if (!token) {
        setChecked(true);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/facebook/connect', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.fbPage && res.data.fbPage.id) {
          setHasPage(true);
        } else {
          setHasPage(false);
        }
      } catch (err) {
        console.error('Error checking FB page connection on integration page:', err);
        setHasPage(false);
      } finally {
        setChecked(true);
        setLoading(false);
      }
    }
    checkAndRedirect();
    // eslint-disable-next-line
  }, [token]);

  if (loading || !checked) {
    return null;
  }

  return <FacebookIntegration />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/facebook-integration" 
              element={
                <PrivateRoute>
                   <RedirectToFbIntegration />
                </PrivateRoute>
               }
            />
            <Route
              path="/"
              element={
                <PrivateRoute>
                   <RequireFbPage>
                     <Dashboard />
                   </RequireFbPage>
                </PrivateRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 