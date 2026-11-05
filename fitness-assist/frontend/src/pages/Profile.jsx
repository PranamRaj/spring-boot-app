import { useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { gsap, reducedMotion, useReveal, EASE } from '../lib/motion.js';
import { Card, ErrorBox, Field, PageHeader, Panel, Readout, Skeleton, Stat } from '../components/ui.jsx';
import { IconCheck } from '../components/icons.jsx';
import { ACTIVITY, GOALS } from './Register.jsx';

const TARGETS = [
  ['Calories', 'dailyCalorieTarget', 'kcal'],
  ['Protein', 'proteinTargetG', 'g'],
  ['Carbs', 'carbsTargetG', 'g'],
  ['Fat', 'fatTargetG', 'g'],
];

export default function Profile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(null);
  const [targets, setTargets] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const savedRef = useRef(null);

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

  const scope = useReveal([!!form]);

  // The confirmation nudges in rather than appearing beside the button.
  useEffect(() => {
    if (!saved || !savedRef.current || reducedMotion()) return;
    const tween = gsap.from(savedRef.current, {
      opacity: 0,
      x: -10,
      duration: 0.4,
      ease: EASE,
      clearProps: 'all',
    });
    const hide = setTimeout(() => setSaved(false), 4000);
    return () => {
      tween.kill();
      clearTimeout(hide);
    };
  }, [saved]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  };

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorBox message={error} />
        <Skeleton className="h-32 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    );
  }

  return (
    <div ref={scope} className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
      <PageHeader
        title="Profile and goals"
        subtitle="These numbers drive your daily targets. Saving recalculates them straight away."
      />

      <ErrorBox message={error} />

      {/* Current targets. Each figure counts to its new value after a save. */}
      <Card tilt reveal="">
        <div className="eyebrow mb-5">Daily targets</div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:gap-10">
          <Readout
            value={targets.dailyCalorieTarget}
            unit="kcal"
            caption="Calories per day"
            tone="signal"
            className="shrink-0"
          />
          <div className="grid flex-1 grid-cols-3 gap-4 sm:border-l sm:border-white/[0.07] sm:pb-1 sm:pl-10">
            {TARGETS.slice(1).map(([name, key, unit]) => (
              <Stat key={key} title={name} value={targets[key]} unit={unit} />
            ))}
          </div>
        </div>
      </Card>

      <Panel reveal="" title="Your details">
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <input className="input" required value={form.name} onChange={set('name')} />
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
              <input className="input tnum" type="number" step="0.1" required value={form.heightCm} onChange={set('heightCm')} />
            </Field>
            <Field label="Weight (kg)">
              <input className="input tnum" type="number" step="0.1" required value={form.weightKg} onChange={set('weightKg')} />
            </Field>
            <Field label="Goal">
              <select className="input" value={form.goal} onChange={set('goal')}>
                {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <Field label="Workouts per week" hint="Used for your consistency score">
              <input
                className="input tnum"
                type="number"
                min="1"
                max="14"
                value={form.weeklyWorkoutTarget}
                onChange={set('weeklyWorkoutTarget')}
              />
            </Field>
            <Field label="Activity level" className="sm:col-span-2">
              <select className="input" value={form.activityLevel} onChange={set('activityLevel')}>
                {ACTIVITY.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-white/[0.06] pt-5">
            <button className="btn" disabled={busy}>
              {busy ? 'Saving…' : 'Save and recalculate'}
            </button>
            {saved && (
              <span ref={savedRef} className="inline-flex items-center gap-1.5 text-sm text-signal-300">
                <IconCheck size={15} />
                Saved — today&apos;s targets are updated.
              </span>
            )}
          </div>
        </form>
      </Panel>
    </div>
  );
}
