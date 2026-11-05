import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Exercises from './pages/Exercises.jsx';
import Routines from './pages/Routines.jsx';
import Workouts from './pages/Workouts.jsx';
import WorkoutSession from './pages/WorkoutSession.jsx';
import Nutrition from './pages/Nutrition.jsx';
import Progress from './pages/Progress.jsx';
import Profile from './pages/Profile.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<Protected><Dashboard /></Protected>} />
      <Route path="/exercises" element={<Protected><Exercises /></Protected>} />
      <Route path="/routines" element={<Protected><Routines /></Protected>} />
      <Route path="/workouts" element={<Protected><Workouts /></Protected>} />
      <Route path="/workouts/:id" element={<Protected><WorkoutSession /></Protected>} />
      <Route path="/nutrition" element={<Protected><Nutrition /></Protected>} />
      <Route path="/progress" element={<Protected><Progress /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
