import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { gsap, reducedMotion, useReveal, EASE } from '../lib/motion.js';
import { Card, Chip, Empty, ErrorBox, Field, PageHeader, Panel, label } from '../components/ui.jsx';
import { IconArrow, IconClose, IconLayers, IconPlus, IconTrash } from '../components/icons.jsx';

/**
 * One line of the builder. It animates itself in on mount and plays itself out
 * before telling the parent to drop it, so rows never pop in or vanish.
 */
function BuilderRow({ row, index, exercises, onChange, onRemove }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || reducedMotion()) return;
    const tween = gsap.from(ref.current, {
      opacity: 0,
      y: -12,
      duration: 0.45,
      ease: EASE,
      clearProps: 'all',
    });
    return () => tween.kill();
  }, []);

  const remove = () => {
    if (!ref.current || reducedMotion()) return onRemove();
    gsap.to(ref.current, {
      opacity: 0,
      x: -24,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: onRemove,
    });
  };

  return (
    <div
      ref={ref}
      className="grid items-end gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:grid-cols-[1fr_6rem_6rem_auto] sm:border-0 sm:bg-transparent sm:p-0"
    >
      <Field label={`Exercise ${index + 1}`}>
        <select
          className="input"
          value={row.exerciseId}
          onChange={(e) => onChange({ exerciseId: e.target.value })}
        >
          {exercises.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name} — {label(x.muscleGroup)}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Sets">
        <input
          className="input tnum"
          type="number"
          min="1"
          max="20"
          value={row.targetSets}
          onChange={(e) => onChange({ targetSets: e.target.value })}
        />
      </Field>
      <Field label="Reps">
        <input
          className="input tnum"
          type="number"
          min="1"
          max="100"
          value={row.targetReps}
          onChange={(e) => onChange({ targetReps: e.target.value })}
        />
      </Field>
      <button
        type="button"
        onClick={remove}
        aria-label={`Remove exercise ${index + 1}`}
        className="btn-ghost w-full px-2.5 py-2.5 text-ink-400 hover:text-rose-300 sm:w-auto"
      >
        <IconClose size={16} />
        <span className="sm:hidden">Remove</span>
      </button>
    </div>
  );
}

export default function Routines() {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = () => api.get('/routines').then((r) => setRoutines(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    api.get('/exercises').then((r) => setExercises(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const scope = useReveal([routines.length]);

  const addRow = () =>
    exercises.length &&
    setRows((r) => [...r, { exerciseId: exercises[0].id, targetSets: 3, targetReps: 10 }]);

  const updateRow = (i, patch) => setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const create = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
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
    } finally {
      setBusy(false);
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
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Routines"
        subtitle="A routine is a named list of exercises with target sets and reps. Starting one pre-fills a workout."
      />

      <ErrorBox message={error} />

      <Panel reveal="" title="Build a routine" note="Name it, add the exercises, save.">
        <form onSubmit={create} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                className="input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Push day"
              />
            </Field>
            <Field label="Notes" hint="Optional">
              <input
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Chest, shoulders, triceps"
              />
            </Field>
          </div>

          {rows.length > 0 && (
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              {rows.map((r, i) => (
                <BuilderRow
                  key={i}
                  row={r}
                  index={i}
                  exercises={exercises}
                  onChange={(patch) => updateRow(i, patch)}
                  onRemove={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 border-t border-white/[0.06] pt-5">
            <button type="button" className="btn-ghost" onClick={addRow} disabled={!exercises.length}>
              <IconPlus size={16} />
              Add exercise
            </button>
            <button className="btn" disabled={!name || rows.length === 0 || busy}>
              {busy ? 'Saving…' : 'Save routine'}
            </button>
          </div>
        </form>
      </Panel>

      {routines.length === 0 ? (
        <div data-reveal>
          <Empty icon={IconLayers} title="No routines yet">
            Build your first one above — three or four exercises is plenty to start.
          </Empty>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {routines.map((r) => (
            <Card key={r.id} tilt reveal="scale" className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[1.0625rem] font-semibold tracking-tight">{r.name}</h3>
                  {r.notes && <p className="mt-1 text-sm text-ink-400">{r.notes}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Chip>{r.exercises.length} moves</Chip>
                  <button className="btn-danger" onClick={() => remove(r.id)} aria-label={`Delete ${r.name}`}>
                    <IconTrash size={15} />
                  </button>
                </div>
              </div>

              <ul className="my-4 flex-1 border-t border-white/[0.06]">
                {r.exercises.map((x) => (
                  <li key={x.id} className="row py-2.5">
                    <span className="min-w-0 truncate text-ink-200">{x.exerciseName}</span>
                    <span className="tnum shrink-0 font-mono text-xs text-ink-400">
                      {x.targetSets} × {x.targetReps}
                    </span>
                  </li>
                ))}
              </ul>

              <button className="btn w-full" onClick={() => start(r.id)}>
                Start this workout
                <IconArrow size={16} />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
