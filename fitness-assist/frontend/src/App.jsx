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
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminTrainees from './pages/admin/AdminTrainees.jsx';
import AdminTraineeDetail from './pages/admin/AdminTraineeDetail.jsx';
import DataManager from './pages/admin/DataManager.jsx';

function Protected({ children }) {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

/** Admin-only pages. The API enforces the role too; this just keeps trainees out of a page that would 403. */
function AdminOnly({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return isAdmin ? <Layout>{children}</Layout> : <Navigate to="/" replace />;
}

/** An admin has no training data of their own, so their home is the admin overview. */
function Home() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : <Protected><Dashboard /></Protected>;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminOnly><AdminOverview /></AdminOnly>} />
      <Route path="/admin/trainees" element={<AdminOnly><AdminTrainees /></AdminOnly>} />
      <Route path="/admin/trainees/:id" element={<AdminOnly><AdminTraineeDetail /></AdminOnly>} />
      <Route path="/admin/data" element={<AdminOnly><DataManager /></AdminOnly>} />
      <Route path="/admin/data/:table" element={<AdminOnly><DataManager /></AdminOnly>} />
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
