import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ErrorBox, Field } from '../components/ui.jsx';

export const ACTIVITY = [
  ['SEDENTARY', 'Sedentary (desk job, little exercise)'],
  ['LIGHT', 'Light (1-3 days/week)'],
  ['MODERATE', 'Moderate (3-5 days/week)'],
  ['ACTIVE', 'Active (6-7 days/week)'],
  ['VERY_ACTIVE', 'Very active (physical job + training)'],
];

export const GOALS = [
  ['FAT_LOSS', 'Fat loss'],
  ['MUSCLE_GAIN', 'Muscle gain'],
  ['MAINTENANCE', 'Maintenance'],
];

export default function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', sex: 'MALE', age: 25, heightCm: 170, weightKg: 70,
    activityLevel: 'MODERATE', goal: 'MAINTENANCE',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });
      signIn(data);
      navigate('/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <form onSubmit={submit} className="card w-full max-w-lg space-y-4">
        <h1 className="text-xl font-bold text-brand-700">Create your account</h1>
        <p className="text-sm text-slate-500">
          Your details set a daily calorie and macro target for your goal. You can change them later.
        </p>
        <ErrorBox message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><input className="input" required value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><input className="input" type="email" required value={form.email} onChange={set('email')} /></Field>
          <Field label="Password (8+ characters)">
            <input className="input" type="password" required minLength={8} value={form.password} onChange={set('password')} />
          </Field>
          <Field label="Sex">
            <select className="input" value={form.sex} onChange={set('sex')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Age"><input className="input" type="number" min="10" max="100" required value={form.age} onChange={set('age')} /></Field>
          <Field label="Height (cm)"><input className="input" type="number" min="100" max="250" step="0.1" required value={form.heightCm} onChange={set('heightCm')} /></Field>
          <Field label="Weight (kg)"><input className="input" type="number" min="30" max="400" step="0.1" required value={form.weightKg} onChange={set('weightKg')} /></Field>
          <Field label="Goal">
            <select className="input" value={form.goal} onChange={set('goal')}>
              {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Activity level">
          <select className="input" value={form.activityLevel} onChange={set('activityLevel')}>
            {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating...' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">
          Already registered? <Link to="/login" className="font-medium text-brand-700">Log in</Link>
        </p>
      </form>
    </div>
  );
}
