import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { ErrorBox, Field } from '../components/ui.jsx';

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
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-xl font-bold text-brand-700">Fitness Assist</h1>
        <p className="text-sm text-slate-500">Log in to track workouts, meals and progress.</p>
        <ErrorBox message={error} />
        <Field label="Email">
          <input className="input" type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Password">
          <input className="input" type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn w-full" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        <p className="text-center text-sm text-slate-500">
          New here? <Link to="/register" className="font-medium text-brand-700">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
