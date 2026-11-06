import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../../api.js';
import { gsap, reducedMotion, EASE } from '../../lib/motion.js';
import { ErrorBox, Field } from '../../components/ui.jsx';
import { IconClose } from '../../components/icons.jsx';
import { ACTIVITY, GOALS } from '../Register.jsx';

export const GOAL_LABEL = Object.fromEntries(GOALS);

/** Engagement states from the API, with how each one reads in the UI. */
export const ENGAGEMENT = {
  ACTIVE: { label: 'Active', className: 'chip-signal', hint: 'Trained or logged food in the last 7 days' },
  NEW: { label: 'New', className: 'border-cool/30 bg-cool/10 text-cool', hint: 'Joined this week' },
  INACTIVE: { label: 'Inactive', className: 'chip-warn', hint: 'Nothing logged in 7+ days' },
  SUSPENDED: { label: 'Suspended', className: 'border-rose-400/30 bg-rose-400/10 text-rose-300', hint: 'Cannot log in' },
};

export function EngagementChip({ value }) {
  const e = ENGAGEMENT[value] || ENGAGEMENT.INACTIVE;
  return (
    <span title={e.hint} className={`chip ${e.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {e.label}
    </span>
  );
}

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const lastSeen = (days) => {
  if (days == null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

export const signed = (n, unit = '') => (n == null ? '—' : `${n > 0 ? '+' : ''}${n}${unit}`);

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export function Avatar({ name, size = 'h-9 w-9 text-xs' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-white/[0.04] font-semibold text-signal-300 ${size}`}
    >
      {initials(name)}
    </span>
  );
}

/** Downloads trainee rows as a CSV file, for spreadsheets or reports. */
export function exportCsv(rows) {
  const cols = [
    ['Name', (r) => r.name],
    ['Email', (r) => r.email],
    ['Goal', (r) => GOAL_LABEL[r.goal] || r.goal],
    ['Status', (r) => ENGAGEMENT[r.engagement]?.label || r.engagement],
    ['Joined', (r) => r.joinedAt?.slice(0, 10)],
    ['Last active', (r) => r.lastActive],
    ['Start weight (kg)', (r) => r.startWeightKg],
    ['Current weight (kg)', (r) => r.currentWeightKg],
    ['Weight change (kg)', (r) => r.weightChangeKg],
    ['Workouts (total)', (r) => r.totalWorkouts],
    ['Workouts (last 7 days)', (r) => r.workoutsLast7Days],
    ['Weekly target', (r) => r.weeklyWorkoutTarget],
    ['Total volume (kg)', (r) => r.totalVolume],
    ['Consistency score', (r) => r.consistencyScore],
  ];
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const csv = [cols.map(([h]) => h), ...rows.map((r) => cols.map(([, f]) => f(r)))]
    .map((line) => line.map(cell).join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), {
    href: url,
    download: `trainees-${new Date().toLocaleDateString('en-CA')}.csv`,
  });
  a.click();
  URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ modal */

export function Modal({ open, title, onClose, children, width = 'max-w-lg' }) {
  const panel = useRef(null);
  // Callers pass inline handlers; reading through a ref keeps the effect from re-running each render.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && closeRef.current();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    panel.current?.querySelector('input, textarea, select, button')?.focus();
    const tween =
      !reducedMotion() &&
      gsap.from(panel.current, { opacity: 0, y: 16, scale: 0.98, duration: 0.35, ease: EASE, clearProps: 'all' });
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      tween && tween.kill();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`card relative max-h-[92vh] w-full overflow-y-auto ${width}`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="btn-ghost px-2 py-1.5">
            <IconClose size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Confirmation for destructive actions. The confirm button stays disabled while the request runs. */
export function ConfirmModal({ open, title, children, confirmLabel, danger = true, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={title} onClose={onClose} width="max-w-md">
      <div className="space-y-5 text-sm text-ink-300">
        {children}
        <ErrorBox message={error} />
        <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className={danger ? 'btn bg-rose-500 text-white hover:bg-rose-400' : 'btn'}
            disabled={busy}
            onClick={go}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------- add trainee form */

const blank = {
  name: '', email: '', password: '', sex: 'MALE', age: 25, heightCm: 170, weightKg: 70,
  activityLevel: 'MODERATE', goal: 'MAINTENANCE',
};

/** A readable temporary password the coach can pass on; the trainee can keep or change it later. */
const tempPassword = () => {
  const words = ['Lift', 'Squat', 'Sprint', 'Press', 'Row', 'Climb', 'Power', 'Stride'];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(1000 + Math.random() * 9000)}-Fit`;
};

export function AddTraineeModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...blank, password: tempPassword() });
      setError('');
    }
  }, [open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/admin/trainees', {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
      });
      onCreated(data, form.password);
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title="Add a trainee" onClose={onClose} width="max-w-2xl">
      <form onSubmit={submit} className="space-y-5">
        <ErrorBox message={error} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className="input" required value={form.name} onChange={set('name')} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Temporary password" hint="Share this with the trainee so they can log in." className="sm:col-span-2">
            <div className="flex gap-2">
              <input className="input font-mono" required minLength={8} value={form.password} onChange={set('password')} />
              <button type="button" className="btn-ghost shrink-0" onClick={() => setForm({ ...form, password: tempPassword() })}>
                Regenerate
              </button>
            </div>
          </Field>
          <Field label="Sex">
            <select className="input" value={form.sex} onChange={set('sex')}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Age">
            <input className="input tnum" type="number" min="10" max="100" required value={form.age} onChange={set('age')} />
          </Field>
          <Field label="Height (cm)">
            <input className="input tnum" type="number" step="0.1" min="100" max="250" required value={form.heightCm} onChange={set('heightCm')} />
          </Field>
          <Field label="Weight (kg)">
            <input className="input tnum" type="number" step="0.1" min="30" max="400" required value={form.weightKg} onChange={set('weightKg')} />
          </Field>
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
        <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" disabled={busy}>
            {busy ? 'Creating…' : 'Create trainee'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
