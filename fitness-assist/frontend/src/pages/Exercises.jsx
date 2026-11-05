import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { ErrorBox, label } from '../components/ui.jsx';

export default function Exercises() {
  const [meta, setMeta] = useState({ muscleGroups: [], equipment: [] });
  const [filters, setFilters] = useState({ muscleGroup: '', equipment: '', q: '' });
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exercises/meta').then((r) => setMeta(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const t = setTimeout(() => {
      api.get('/exercises', { params }).then((r) => setItems(r.data)).catch((e) => setError(errMsg(e)));
    }, 200);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Exercise library</h1>
      <ErrorBox message={error} />
      <div className="card grid gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search by name" value={filters.q} onChange={set('q')} />
        <select className="input" value={filters.muscleGroup} onChange={set('muscleGroup')}>
          <option value="">All muscle groups</option>
          {meta.muscleGroups.map((m) => <option key={m} value={m}>{label(m)}</option>)}
        </select>
        <select className="input" value={filters.equipment} onChange={set('equipment')}>
          <option value="">All equipment</option>
          {meta.equipment.map((m) => <option key={m} value={m}>{label(m)}</option>)}
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((e) => (
          <div key={e.id} className="card">
            <div className="font-semibold">{e.name}</div>
            <div className="mt-1 flex gap-2 text-xs">
              <span className="rounded bg-brand-50 px-2 py-0.5 text-brand-700">{label(e.muscleGroup)}</span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">{label(e.equipment)}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{e.description}</p>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-500">No exercises match those filters.</p>}
      </div>
    </div>
  );
}
