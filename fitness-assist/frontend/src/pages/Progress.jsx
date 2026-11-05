import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import api, { errMsg, todayStr } from '../api.js';
import { ErrorBox, Field } from '../components/ui.jsx';

const emptyMetric = { date: todayStr(), weightKg: '', waistCm: '', chestCm: '', hipsCm: '', armCm: '', thighCm: '' };

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

export default function Progress() {
  const [days, setDays] = useState(90);
  const [weight, setWeight] = useState(null);
  const [volume, setVolume] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [strength, setStrength] = useState(null);
  const [form, setForm] = useState(emptyMetric);
  const [error, setError] = useState('');

  const loadAll = () => {
    api.get('/progress/weight', { params: { days } }).then((r) => setWeight(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/progress/volume', { params: { weeks: 12 } }).then((r) => setVolume(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/metrics', { params: { from: new Date(Date.now() - days * 86400000).toLocaleDateString('en-CA') } })
      .then((r) => setMetrics(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/summaries/weekly').then((r) => setSummaries(r.data)).catch((e) => setError(errMsg(e)));
  };

  useEffect(loadAll, [days]);

  useEffect(() => {
    api.get('/exercises').then((r) => {
      setExercises(r.data);
      if (r.data.length) setExerciseId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!exerciseId) return;
    api.get(`/progress/strength/${exerciseId}`).then((r) => setStrength(r.data)).catch((e) => setError(errMsg(e)));
  }, [exerciseId]);

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const logMetric = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/metrics', {
        date: form.date,
        weightKg: Number(form.weightKg),
        waistCm: numOrNull(form.waistCm),
        chestCm: numOrNull(form.chestCm),
        hipsCm: numOrNull(form.hipsCm),
        armCm: numOrNull(form.armCm),
        thighCm: numOrNull(form.thighCm),
      });
      setForm({ ...emptyMetric, date: form.date });
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeMetric = async (id) => {
    try {
      await api.delete(`/metrics/${id}`);
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const generate = async () => {
    try {
      await api.post('/summaries/weekly/generate');
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Progress</h1>
        <select className="input w-auto" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
        </select>
      </div>
      <ErrorBox message={error} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold">Body weight</h2>
            {weight?.changeKg != null && (
              <span className="text-sm text-slate-500">
                {weight.changeKg > 0 ? '+' : ''}{weight.changeKg} kg over this period
              </span>
            )}
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={weight?.points || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="weightKg" name="Weight (kg)" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold">Strength</h2>
            <select className="input w-auto max-w-[200px]" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
              {exercises.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </div>
          <div className="h-64">
            {strength?.points.length ? (
              <ResponsiveContainer>
                <LineChart data={strength.points}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="bestEstimated1Rm" name="Est. 1RM (kg)" stroke="#059669" strokeWidth={2} />
                  <Line type="monotone" dataKey="maxWeightKg" name="Top weight (kg)" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="pt-8 text-center text-sm text-slate-500">No logged sets for this exercise yet.</p>
            )}
          </div>
        </div>

        <div className="card lg:col-span-2">
          <h2 className="mb-2 font-semibold">Weekly training volume (12 weeks)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={volume}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="weekStart" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="volume" name="Volume (kg)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <form onSubmit={logMetric} className="card space-y-3">
        <h2 className="font-semibold">Log body metrics</h2>
        <p className="text-xs text-slate-500">One entry per day; logging the same date again updates it.</p>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <Field label="Date"><input className="input" type="date" max={todayStr()} value={form.date} onChange={setF('date')} /></Field>
          <Field label="Weight (kg)"><input className="input" type="number" step="0.1" min="20" required value={form.weightKg} onChange={setF('weightKg')} /></Field>
          <Field label="Waist (cm)"><input className="input" type="number" step="0.1" value={form.waistCm} onChange={setF('waistCm')} /></Field>
          <Field label="Chest (cm)"><input className="input" type="number" step="0.1" value={form.chestCm} onChange={setF('chestCm')} /></Field>
          <Field label="Hips (cm)"><input className="input" type="number" step="0.1" value={form.hipsCm} onChange={setF('hipsCm')} /></Field>
          <Field label="Arm (cm)"><input className="input" type="number" step="0.1" value={form.armCm} onChange={setF('armCm')} /></Field>
          <Field label="Thigh (cm)"><input className="input" type="number" step="0.1" value={form.thighCm} onChange={setF('thighCm')} /></Field>
        </div>
        <button className="btn">Save entry</button>
      </form>

      <div className="card overflow-x-auto">
        <h2 className="mb-2 font-semibold">Metric history</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-slate-400">
            <tr><th className="py-1">Date</th><th>Weight</th><th>Waist</th><th>Chest</th><th>Hips</th><th>Arm</th><th>Thigh</th><th /></tr>
          </thead>
          <tbody>
            {[...metrics].reverse().map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="py-1.5">{m.date}</td>
                <td>{m.weightKg}</td>
                <td>{m.waistCm ?? '-'}</td>
                <td>{m.chestCm ?? '-'}</td>
                <td>{m.hipsCm ?? '-'}</td>
                <td>{m.armCm ?? '-'}</td>
                <td>{m.thighCm ?? '-'}</td>
                <td className="text-right"><button className="btn-danger" onClick={() => removeMetric(m.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Weekly consistency</h2>
          <button className="btn-ghost" onClick={generate}>Update this week's summary</button>
        </div>
        {summaries.length === 0 ? (
          <p className="text-sm text-slate-500">No summaries yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaries.map((s) => (
              <div key={s.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="font-medium">{s.weekStart} to {s.weekEnd}</span>
                  <span className="text-lg font-bold text-brand-700">{s.consistencyScore}</span>
                </div>
                <div className="mt-1 text-slate-600">
                  {s.workoutsCompleted} workouts · {s.totalVolume} kg volume<br />
                  {s.daysFoodLogged}/7 days logged · avg {s.avgDailyCalories} kcal
                  {s.weightChangeKg != null && <><br />Weight change {s.weightChangeKg > 0 ? '+' : ''}{s.weightChangeKg} kg</>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
