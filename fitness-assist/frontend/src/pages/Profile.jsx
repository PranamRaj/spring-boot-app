import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ErrorBox, Field } from '../components/ui.jsx';
import { ACTIVITY, GOALS } from './Register.jsx';

export default function Profile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [targets, setTargets] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const apply = (p) => {
    setForm({
      name: p.name, sex: p.sex, age: p.age, heightCm: p.heightCm, weightKg: p.weightKg,
      activityLevel: p.activityLevel, goal: p.goal, weeklyWorkoutTarget: p.weeklyWorkoutTarget,
    });
    setTargets(p);
  };

  useEffect(() => {
    api.get('/profile').then((r) => apply(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    try {
      const { data } = await api.put('/profile', {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        weeklyWorkoutTarget: Number(form.weeklyWorkoutTarget),
      });
      apply(data);
      updateUser(data);
      setSaved(true);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  if (!form) return <ErrorBox message={error} />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile and goals</h1>
      <ErrorBox message={error} />

      <div className="card grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
        {[['Calories', targets.dailyCalorieTarget, 'kcal'], ['Protein', targets.proteinTargetG, 'g'],
          ['Carbs', targets.carbsTargetG, 'g'], ['Fat', targets.fatTargetG, 'g']].map(([n, v, u]) => (
          <div key={n}>
            <div className="text-2xl font-bold text-brand-700">{v}</div>
            <div className="text-xs uppercase text-slate-500">{n} ({u}) per day</div>
          </div>
        ))}
      </div>

      <form onSubmit={save} className="card space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Sex">
            <select className="input" value={form.sex} onChange={set('sex')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Age"><input className="input" type="number" min="10" max="100" required value={form.age} onChange={set('age')} /></Field>
          <Field label="Height (cm)"><input className="input" type="number" step="0.1" required value={form.heightCm} onChange={set('heightCm')} /></Field>
          <Field label="Weight (kg)"><input className="input" type="number" step="0.1" required value={form.weightKg} onChange={set('weightKg')} /></Field>
          <Field label="Workouts per week (target)"><input className="input" type="number" min="1" max="14" value={form.weeklyWorkoutTarget} onChange={set('weeklyWorkoutTarget')} /></Field>
          <Field label="Goal">
            <select className="input" value={form.goal} onChange={set('goal')}>
              {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Activity level">
            <select className="input" value={form.activityLevel} onChange={set('activityLevel')}>
              {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn">Save and recalculate targets</button>
          {saved && <span className="text-sm text-brand-700">Saved. Today's targets are updated.</span>}
        </div>
      </form>
    </div>
  );
}
