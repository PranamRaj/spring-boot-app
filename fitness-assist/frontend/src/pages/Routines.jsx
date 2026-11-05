import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { ErrorBox, Field, label } from '../components/ui.jsx';

export default function Routines() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([]); // { exerciseId, targetSets, targetReps }

  const load = () => api.get('/routines').then((r) => setRoutines(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    api.get('/exercises').then((r) => setExercises(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const addRow = () => exercises.length && setRows([...rows, { exerciseId: exercises[0].id, targetSets: 3, targetReps: 10 }]);
  const updateRow = (i, patch) => setRows(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/routines', {
        name,
        notes,
        exercises: rows.map((r) => ({
          exerciseId: Number(r.exerciseId),
          targetSets: Number(r.targetSets),
          targetReps: Number(r.targetReps),
        })),
      });
      setName('');
      setNotes('');
      setRows([]);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this routine? Past workouts are kept.')) return;
    try {
      await api.delete(`/routines/${id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const start = async (id) => {
    try {
      const { data } = await api.post('/workouts/sessions', { routineId: id });
      navigate(`/workouts/${data.id}`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Routines</h1>
      <ErrorBox message={error} />

      <form onSubmit={create} className="card space-y-4">
        <h2 className="font-semibold">Build a routine</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name"><input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Push day" /></Field>
          <Field label="Notes (optional)"><input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </div>

        {rows.map((r, i) => (
          <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_90px_90px_auto]">
            <Field label="Exercise">
              <select className="input" value={r.exerciseId} onChange={(e) => updateRow(i, { exerciseId: e.target.value })}>
                {exercises.map((x) => <option key={x.id} value={x.id}>{x.name} ({label(x.muscleGroup)})</option>)}
              </select>
            </Field>
            <Field label="Sets"><input className="input" type="number" min="1" max="20" value={r.targetSets} onChange={(e) => updateRow(i, { targetSets: e.target.value })} /></Field>
            <Field label="Reps"><input className="input" type="number" min="1" max="100" value={r.targetReps} onChange={(e) => updateRow(i, { targetReps: e.target.value })} /></Field>
            <button type="button" className="btn-danger pb-2" onClick={() => setRows(rows.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}

        <div className="flex gap-3">
          <button type="button" className="btn-ghost" onClick={addRow}>+ Add exercise</button>
          <button className="btn" disabled={!name || rows.length === 0}>Save routine</button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {routines.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                {r.notes && <p className="text-sm text-slate-500">{r.notes}</p>}
              </div>
              <button className="btn-danger" onClick={() => remove(r.id)}>Delete</button>
            </div>
            <ul className="my-3 space-y-1 text-sm">
              {r.exercises.map((x) => (
                <li key={x.id} className="flex justify-between">
                  <span>{x.exerciseName}</span>
                  <span className="text-slate-500">{x.targetSets} x {x.targetReps}</span>
                </li>
              ))}
            </ul>
            <button className="btn w-full" onClick={() => start(r.id)}>Start this workout</button>
          </div>
        ))}
        {routines.length === 0 && <p className="text-sm text-slate-500">No routines yet. Build one above.</p>}
      </div>
    </div>
  );
}
