import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { ErrorBox, Field } from '../components/ui.jsx';

export default function WorkoutSession() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ exerciseId: '', reps: 10, weightKg: 20 });

  useEffect(() => {
    api.get(`/workouts/sessions/${id}`).then((r) => setSession(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/exercises').then((r) => {
      setExercises(r.data);
      if (r.data.length) setForm((f) => ({ ...f, exerciseId: r.data[0].id }));
    });
  }, [id]);

  const addSet = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post(`/workouts/sessions/${id}/sets`, {
        exerciseId: Number(form.exerciseId),
        reps: Number(form.reps),
        weightKg: Number(form.weightKg),
      });
      setSession(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeSet = async (setId) => {
    try {
      const { data } = await api.delete(`/workouts/sessions/${id}/sets/${setId}`);
      setSession(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const finish = async () => {
    setError('');
    try {
      const { data } = await api.post(`/workouts/sessions/${id}/finish`);
      setSession(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!session) return <ErrorBox message={error} />;

  const grouped = session.exerciseVolumes.map((ev) => ({
    ...ev,
    sets: session.sets.filter((s) => s.exerciseId === ev.exerciseId),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <p className="text-sm text-slate-500">
            Started {new Date(session.startedAt).toLocaleString()}
            {session.finished && ` · finished, ${session.durationMinutes} min`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{session.totalVolume} <span className="text-base font-normal text-slate-500">kg total volume</span></div>
        </div>
      </div>
      <ErrorBox message={error} />

      {!session.finished && (
        <form onSubmit={addSet} className="card grid items-end gap-3 sm:grid-cols-[1fr_100px_120px_auto]">
          <Field label="Exercise">
            <select className="input" value={form.exerciseId} onChange={(e) => setForm({ ...form, exerciseId: e.target.value })}>
              {exercises.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Field>
          <Field label="Reps"><input className="input" type="number" min="1" required value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} /></Field>
          <Field label="Weight (kg)"><input className="input" type="number" min="0" step="0.5" required value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: e.target.value })} /></Field>
          <button className="btn">Log set</button>
        </form>
      )}

      {grouped.length === 0 && <p className="text-sm text-slate-500">No sets yet. Log your first set above.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {grouped.map((g) => (
          <div key={g.exerciseId} className="card">
            <div className="mb-2 flex items-baseline justify-between">
              <h3 className="font-semibold">{g.exerciseName}</h3>
              <span className="text-sm text-brand-700">{g.volume} kg volume</span>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-400">
                <tr><th className="py-1">Set</th><th>Reps</th><th>Weight</th><th>Volume</th><th /></tr>
              </thead>
              <tbody>
                {g.sets.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="py-1.5">{s.setNumber}</td>
                    <td>{s.reps}</td>
                    <td>{s.weightKg} kg</td>
                    <td>{s.volume}</td>
                    <td className="text-right">
                      {!session.finished && <button className="btn-danger" onClick={() => removeSet(s.id)}>x</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {!session.finished && session.sets.length > 0 && (
        <button className="btn" onClick={finish}>Finish workout</button>
      )}
    </div>
  );
}
