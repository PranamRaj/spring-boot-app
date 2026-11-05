import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AuthShell, { AuthPoints } from '../components/AuthShell.jsx';
import { Card, ErrorBox, Field } from '../components/ui.jsx';
import { IconArrow } from '../components/icons.jsx';

export const ACTIVITY = [
  ['SEDENTARY', 'Sedentary — desk job, little exercise'],
  ['LIGHT', 'Light — 1-3 days a week'],
  ['MODERATE', 'Moderate — 3-5 days a week'],
  ['ACTIVE', 'Active — 6-7 days a week'],
  ['VERY_ACTIVE', 'Very active — physical job and training'],
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
    <AuthShell
      title="Set the baseline once. Targets follow from it."
      lead="Height, weight, activity and goal give a daily calorie and macro target you can actually train against. Change any of it later and the numbers recalculate."
      aside={
        <AuthPoints
          items={[
            ['Nothing fabricated', 'Every figure traces back to something you logged.'],
            ['Editable', 'Profile changes re-derive today’s targets immediately.'],
            ['Takes a minute', 'Seven fields and you are in.'],
          ]}
        />
      }
    >
      <Card reveal={false} className="w-full">
        <form onSubmit={submit} className="space-y-5">
          <div data-auth-field>
            <h1 className="text-title font-bold">Create your account</h1>
            <p className="mt-1.5 text-sm text-ink-400">You can change all of this later.</p>
          </div>

          <ErrorBox message={error} />

          <div data-auth-field className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <input className="input" autoComplete="name" required value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Email" className="sm:col-span-2">
              <input className="input" type="email" autoComplete="email" required value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Password" hint="8 characters or more" className="sm:col-span-2">
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={set('password')}
              />
            </Field>
          </div>

          <div data-auth-field className="grid grid-cols-2 gap-4">
            <Field label="Sex">
              <select className="input" value={form.sex} onChange={set('sex')}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </Field>
            <Field label="Age">
              <input className="input" type="number" min="10" max="100" required value={form.age} onChange={set('age')} />
            </Field>
            <Field label="Height (cm)">
              <input className="input" type="number" min="100" max="250" step="0.1" required value={form.heightCm} onChange={set('heightCm')} />
            </Field>
            <Field label="Weight (kg)">
              <input className="input" type="number" min="30" max="400" step="0.1" required value={form.weightKg} onChange={set('weightKg')} />
            </Field>
          </div>

          <div data-auth-field className="grid gap-4">
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

          <div data-auth-field className="space-y-4 pt-1">
            <button className="btn w-full" disabled={busy}>
              {busy ? 'Creating…' : 'Create account'}
              {!busy && <IconArrow size={16} />}
            </button>
            <p className="text-center text-sm text-ink-400">
              Already registered?{' '}
              <Link to="/login" className="link">
                Log in
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
}
