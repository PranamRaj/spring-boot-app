import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AuthShell, { AuthPoints } from '../components/AuthShell.jsx';
import { Card, ErrorBox, Field } from '../components/ui.jsx';
import { IconArrow } from '../components/icons.jsx';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'user@gmail.com', password: 'user123' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
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
      title="Your numbers, not someone else's programme."
      lead="Log every set, meal and measurement in one place. Calorie and macro targets come from your own height, weight, activity and goal — and move when they do."
      aside={
        <AuthPoints
          items={[
            ['Sets and volume', 'Log a workout as you train and watch total volume build per exercise.'],
            ['Daily macros', 'Targets derived from your profile, with what is left for the day.'],
            ['Weekly score', 'A consistency figure from workouts completed and days logged.'],
          ]}
        />
      }
    >
      <Card reveal={false} className="w-full">
        <form onSubmit={submit} className="space-y-5">
          <div data-auth-field>
            <h1 className="text-title font-bold">Log in</h1>
            <p className="mt-1.5 text-sm text-ink-400">Pick up where you left off.</p>
          </div>

          <ErrorBox message={error} />

          <div data-auth-field>
            <Field label="Email">
              <input
                className="input"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>

          <div data-auth-field>
            <Field label="Password">
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </Field>
          </div>

          <div data-auth-field className="space-y-4 pt-1">
            <button className="btn w-full" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
              {!busy && <IconArrow size={16} />}
            </button>
            <p className="text-center text-sm text-ink-400">
              New here?{' '}
              <Link to="/register" className="link">
                Create an account
              </Link>
            </p>
          </div>
        </form>
      </Card>
    </AuthShell>
  );
}
