import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { gsap, reducedMotion, useReveal, useCountUp, EASE } from '../lib/motion.js';
import { Card, Chip, Empty, ErrorBox, Field, Panel, Skeleton } from '../components/ui.jsx';
import { IconArrow, IconCheck, IconClock, IconClose, IconPlus, IconPulse } from '../components/icons.jsx';

export default function WorkoutSession() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ exerciseId: '', reps: 10, weightKg: 20 });

  useEffect(() => {
    api.get(`/workouts/sessions/${id}`).then((r) => setSession(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/exercises').then((r) => {
      setExercises(r.data);
      if (r.data.length) setForm((f) => ({ ...f, exerciseId: r.data[0].id }));
    });
  }, [id]);

  const scope = useReveal([session?.exerciseVolumes.length]);

  // Any set added after first load is highlighted as it appears.
  const known = useRef(null);
  useEffect(() => {
    if (!session) return;
    const ids = session.sets.map((s) => s.id);
    if (known.current === null) {
      known.current = new Set(ids);
      return;
    }
    const fresh = ids.filter((x) => !known.current.has(x));
    known.current = new Set(ids);
    if (!fresh.length || reducedMotion()) return;

    const nodes = fresh
      .map((sid) => document.querySelector(`[data-set-id="${sid}"]`))
      .filter(Boolean);
    if (!nodes.length) return;

    const tl = gsap.timeline();
    tl.from(nodes, { opacity: 0, x: -16, duration: 0.45, ease: EASE, clearProps: 'all' }).fromTo(
      nodes,
      { backgroundColor: 'rgba(195,245,60,0.14)' },
      { backgroundColor: 'rgba(195,245,60,0)', duration: 1.1, ease: 'power1.out', clearProps: 'backgroundColor' },
      0
    );
    return () => tl.kill();
  }, [session]);

  const addSet = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { data } = await api.post(`/workouts/sessions/${id}/sets`, {
        exerciseId: Number(form.exerciseId),
        reps: Number(form.reps),
        weightKg: Number(form.weightKg),
      });
      setSession(data);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
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

  if (!session) {
    return (
      <div className="space-y-6">
        <ErrorBox message={error} />
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
    );
  }

  const grouped = session.exerciseVolumes.map((ev) => ({
    ...ev,
    sets: session.sets.filter((s) => s.exerciseId === ev.exerciseId),
  }));

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <Link to="/workouts" className="inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-100">
        <IconArrow size={14} className="rotate-180" />
        All workouts
      </Link>

      {/* Session header. The volume figure counts up every time a set lands. */}
      <Card reveal="">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {session.finished ? (
                <Chip tone="signal">
                  <IconCheck size={13} />
                  Finished
                </Chip>
              ) : (
                <Chip tone="warn">In progress</Chip>
              )}
              {session.durationMinutes != null && (
                <Chip>
                  <IconClock size={13} />
                  {session.durationMinutes} min
                </Chip>
              )}
            </div>
            <h1 className="text-display font-bold">{session.name}</h1>
            <p className="mt-2 text-sm text-ink-400">
              Started {new Date(session.startedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-end gap-6">
            <VolumeReadout total={session.totalVolume} />
            <div className="hidden sm:block">
              <div className="eyebrow">Sets</div>
              <div className="tnum mt-1 font-mono text-2xl font-bold">{session.sets.length}</div>
            </div>
          </div>
        </div>
      </Card>

      <ErrorBox message={error} />

      {!session.finished && (
        <Panel reveal="" title="Log a set" className="sticky top-2 z-20 lg:top-4">
          <form onSubmit={addSet} className="grid items-end gap-3 sm:grid-cols-[1fr_6rem_7rem_auto]">
            <Field label="Exercise">
              <select
                className="input"
                value={form.exerciseId}
                onChange={(e) => setForm({ ...form, exerciseId: e.target.value })}
              >
                {exercises.map((x) => (
                  <option key={x.id} value={x.id}>{x.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Reps">
              <input
                className="input tnum"
                type="number"
                min="1"
                required
                value={form.reps}
                onChange={(e) => setForm({ ...form, reps: e.target.value })}
              />
            </Field>
            <Field label="Weight (kg)">
              <input
                className="input tnum"
                type="number"
                min="0"
                step="0.5"
                required
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </Field>
            <button className="btn h-[2.875rem]" disabled={busy}>
              <IconPlus size={16} />
              Log set
            </button>
          </form>
        </Panel>
      )}

      {grouped.length === 0 ? (
        <div data-reveal>
          <Empty icon={IconPulse} title="No sets yet">
            Pick an exercise above, enter reps and weight, and log your first set.
          </Empty>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {grouped.map((g) => (
            <Card key={g.exerciseId} tilt reveal="scale">
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-3">
                <h3 className="min-w-0 truncate text-[1.0625rem] font-semibold tracking-tight">{g.exerciseName}</h3>
                <span className="tnum shrink-0 font-mono text-sm text-signal-300">{g.volume} kg</span>
              </div>

              {/* A list, not a table — it holds its shape at any width. */}
              <ul>
                {g.sets.map((s) => (
                  <li
                    key={s.id}
                    data-set-id={s.id}
                    className="flex items-center gap-3 rounded-lg border-t border-white/[0.06] px-1 py-2 text-sm first:border-t-0"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] font-mono text-[0.6875rem] text-ink-400">
                      {s.setNumber}
                    </span>
                    <span className="tnum flex-1 font-mono text-ink-100">
                      {s.reps} <span className="text-ink-500">reps ×</span> {s.weightKg}
                      <span className="text-ink-500"> kg</span>
                    </span>
                    <span className="tnum shrink-0 font-mono text-xs text-ink-400">{s.volume} kg</span>
                    {!session.finished && (
                      <button
                        className="btn-danger shrink-0"
                        onClick={() => removeSet(s.id)}
                        aria-label={`Delete set ${s.setNumber} of ${g.exerciseName}`}
                      >
                        <IconClose size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}

      {!session.finished && session.sets.length > 0 && (
        <div data-reveal className="flex justify-end">
          <button className="btn" onClick={finish}>
            <IconCheck size={16} />
            Finish workout
          </button>
        </div>
      )}
    </div>
  );
}

function VolumeReadout({ total }) {
  const ref = useCountUp(total);
  return (
    <div>
      <div className="eyebrow">Total volume</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span ref={ref} className="tnum font-mono text-[2.25rem] font-bold leading-none text-ink-50">
          0
        </span>
        <span className="text-sm text-ink-400">kg</span>
      </div>
    </div>
  );
}
