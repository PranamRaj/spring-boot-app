import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ErrorBox, ProgressBar } from '../components/ui.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const [daily, setDaily] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/nutrition/daily'),
      api.get('/workouts/sessions'),
      api.get('/summaries/weekly'),
    ])
      .then(([d, s, w]) => {
        setDaily(d.data);
        setSessions(s.data.slice(0, 5));
        setSummary(w.data[0] || null);
      })
      .catch((e) => setError(errMsg(e)));
  }, []);

  const remaining = daily?.remaining.calories ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hi, {user?.name?.split(' ')[0]}</h1>
      <ErrorBox message={error} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Today's calories</h2>
            <Link to="/nutrition" className="text-sm font-medium text-brand-700">Log food</Link>
          </div>
          {daily && (
            <>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <span className="text-3xl font-bold">{Math.abs(remaining)}</span>
                  <span className="ml-1 text-sm text-slate-500">kcal {remaining >= 0 ? 'remaining' : 'over target'}</span>
                </div>
                <div className="text-sm text-slate-500">
                  {daily.consumed.calories} / {daily.target.calories} kcal
                </div>
              </div>
              <ProgressBar value={daily.consumed.calories} max={daily.target.calories} over={daily.overCalorieTarget} />
              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                {[['Protein', 'proteinG'], ['Carbs', 'carbsG'], ['Fat', 'fatG']].map(([name, key]) => (
                  <div key={key}>
                    <div className="mb-1 flex justify-between text-slate-600">
                      <span>{name}</span>
                      <span>{daily.consumed[key]} / {daily.target[key]} g</span>
                    </div>
                    <ProgressBar value={daily.consumed[key]} max={daily.target[key]} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Last week</h2>
            <Link to="/progress" className="text-sm font-medium text-brand-700">Details</Link>
          </div>
          {summary ? (
            <div className="space-y-2 text-sm">
              <div className="text-3xl font-bold">{summary.consistencyScore}<span className="text-base text-slate-500">/100</span></div>
              <div className="text-slate-500">consistency, week of {summary.weekStart}</div>
              <div>{summary.workoutsCompleted} workouts, {summary.totalVolume} kg volume</div>
              <div>{summary.daysFoodLogged}/7 days of food logged</div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Your first weekly summary appears on Monday, or generate one now from the Progress page.
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-semibold">Recent workouts</h2>
          <Link to="/workouts" className="text-sm font-medium text-brand-700">Start a workout</Link>
        </div>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">No workouts yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <Link to={`/workouts/${s.id}`} className="font-medium hover:text-brand-700">{s.name}</Link>
                <span className="text-slate-500">
                  {new Date(s.startedAt).toLocaleDateString()} · {s.totalVolume} kg
                  {!s.finished && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">in progress</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
