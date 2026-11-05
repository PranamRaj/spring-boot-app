import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { ErrorBox } from '../components/ui.jsx';

export default function Workouts() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const load = () => api.get('/workouts/sessions').then((r) => setSessions(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);

  const startBlank = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workouts/sessions', { name: name || null });
      navigate(`/workouts/${data.id}`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/sessions/${id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Workouts</h1>
      <ErrorBox message={error} />

      <form onSubmit={startBlank} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label className="label">Start an empty workout</label>
          <input className="input" placeholder="Workout name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn">Start</button>
        <Link to="/routines" className="btn-ghost">Or start from a routine</Link>
      </form>

      <div className="card">
        <h2 className="mb-3 font-semibold">History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <Link to={`/workouts/${s.id}`} className="font-medium hover:text-brand-700">{s.name}</Link>
                  <div className="text-slate-500">
                    {new Date(s.startedAt).toLocaleString()} · {s.sets.length} sets · {s.totalVolume} kg volume
                    {s.durationMinutes != null && ` · ${s.durationMinutes} min`}
                    {!s.finished && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">in progress</span>}
                  </div>
                </div>
                <button className="btn-danger" onClick={() => remove(s.id)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
