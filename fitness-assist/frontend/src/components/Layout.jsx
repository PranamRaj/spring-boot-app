import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

const links = [
  ['/', 'Dashboard'],
  ['/exercises', 'Exercises'],
  ['/routines', 'Routines'],
  ['/workouts', 'Workouts'],
  ['/nutrition', 'Nutrition'],
  ['/progress', 'Progress'],
];

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const logout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="text-lg font-bold text-brand-700">Fitness Assist</span>
          <nav className="flex flex-1 flex-wrap gap-1">
            {links.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <NavLink to="/profile" className="text-sm text-slate-600 hover:text-brand-700">
            {user?.name}
          </NavLink>
          <button onClick={logout} className="btn-ghost">Log out</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
