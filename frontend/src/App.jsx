import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';
import Fines from './pages/Fines';
import Votes from './pages/Votes';
import VoteDetail from './pages/VoteDetail';
import Users from './pages/Users';
import Reglement from './pages/Reglement';
import Profile from './pages/Profile';
import Announcements from './pages/Announcements';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="meetings" element={<Meetings />} />
            <Route path="meetings/:id" element={<MeetingDetail />} />
            <Route path="fines" element={<Fines />} />
            <Route path="votes" element={<Votes />} />
            <Route path="votes/:id" element={<VoteDetail />} />
            <Route path="users" element={<Users />} />
            <Route path="reglement" element={<Reglement />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
