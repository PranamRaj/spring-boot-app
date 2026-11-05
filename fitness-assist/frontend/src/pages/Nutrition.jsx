import { useEffect, useState } from 'react';
import api, { errMsg, todayStr } from '../api.js';
import { useReveal, useCountUp } from '../lib/motion.js';
import {
  Card,
  Chip,
  Empty,
  ErrorBox,
  Field,
  MacroMeter,
  PageHeader,
  Panel,
  Ring,
  Skeleton,
  label,
} from '../components/ui.jsx';
import { IconFlame, IconPlus, IconTrash } from '../components/icons.jsx';

const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const MACROS = [
  ['Protein', 'proteinG'],
  ['Carbs', 'carbsG'],
  ['Fat', 'fatG'],
];
const blank = { mealType: 'BREAKFAST', foodName: '', calories: '', proteinG: '', carbsG: '', fatG: '' };

export default function Nutrition() {
  const [date, setDate] = useState(todayStr());
  const [daily, setDaily] = useState(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/nutrition/daily', { params: { date } })
      .then((r) => setDaily(r.data))
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const scope = useReveal([daily?.entries.length, date]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api.post('/nutrition/food-logs', {
        date,
        mealType: form.mealType,
        foodName: form.foodName,
        calories: Number(form.calories),
        proteinG: Number(form.proteinG || 0),
        carbsG: Number(form.carbsG || 0),
        fatG: Number(form.fatG || 0),
      });
      setForm({ ...blank, mealType: form.mealType });
      load();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/nutrition/food-logs/${id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remaining = daily?.remaining.calories ?? 0;
  const over = remaining < 0;
  const isToday = date === todayStr();

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Nutrition"
        subtitle="Targets come from your profile. Log what you actually ate — estimates are fine."
      >
        <div className="flex items-center gap-2">
          {!isToday && (
            <button className="btn-ghost btn-sm" onClick={() => setDate(todayStr())}>
              Today
            </button>
          )}
          <input
            type="date"
            className="input w-auto"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Date"
          />
        </div>
      </PageHeader>

      <ErrorBox message={error} />

      {/* Day summary */}
      {!daily ? (
        <Skeleton className="h-56 rounded-card" />
      ) : (
        <Card tilt reveal="">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-6">
              <Ring value={daily.consumed.calories} max={daily.target.calories} size={144}>
                <RemainingFigure remaining={remaining} over={over} />
              </Ring>
              <div className="min-w-0">
                <div className="eyebrow">Eaten</div>
                {/* Target on its own line, so "kcal" never wraps away from it. */}
                <div className="tnum mt-1.5 font-mono text-xl font-bold leading-none">
                  {daily.consumed.calories}
                </div>
                <div className="tnum mt-1 font-mono text-xs text-ink-500">
                  of {daily.target.calories} kcal
                </div>
                {over && (
                  <Chip tone="warn" className="mt-2.5">
                    Over target
                  </Chip>
                )}
              </div>
            </div>

            <div className="grid flex-1 gap-5 sm:grid-cols-3 lg:border-l lg:border-white/[0.07] lg:pl-8">
              {MACROS.map(([name, key]) => (
                <MacroMeter
                  key={key}
                  name={name}
                  value={daily.consumed[key]}
                  max={daily.target[key]}
                  left={daily.remaining[key]}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Add food */}
      <Panel reveal="" title="Add food" note="Only calories are required.">
        <form onSubmit={add} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Meal">
              <select className="input" value={form.mealType} onChange={set('mealType')}>
                {MEALS.map((m) => (
                  <option key={m} value={m}>{label(m)}</option>
                ))}
              </select>
            </Field>
            <Field label="Food" className="sm:col-span-1 lg:col-span-2">
              <input
                className="input"
                required
                value={form.foodName}
                onChange={set('foodName')}
                placeholder="2 eggs and toast"
              />
            </Field>
            <Field label="Calories">
              <input className="input tnum" type="number" min="0" required value={form.calories} onChange={set('calories')} />
            </Field>
          </div>

          <div className="grid gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Protein (g)">
              <input className="input tnum" type="number" min="0" step="0.1" value={form.proteinG} onChange={set('proteinG')} />
            </Field>
            <Field label="Carbs (g)">
              <input className="input tnum" type="number" min="0" step="0.1" value={form.carbsG} onChange={set('carbsG')} />
            </Field>
            <Field label="Fat (g)">
              <input className="input tnum" type="number" min="0" step="0.1" value={form.fatG} onChange={set('fatG')} />
            </Field>
            <div className="flex items-end">
              <button className="btn w-full" disabled={busy}>
                <IconPlus size={16} />
                {busy ? 'Adding…' : 'Add to day'}
              </button>
            </div>
          </div>
        </form>
      </Panel>

      {/* Meals */}
      {daily && daily.entries.length === 0 ? (
        <div data-reveal>
          <Empty icon={IconFlame} title="Nothing logged for this day">
            Add your first entry above. Rough numbers beat no numbers.
          </Empty>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {MEALS.map((meal) => {
            const entries = daily?.entries.filter((e) => e.mealType === meal) ?? [];
            if (!entries.length) return null;
            const kcal = entries.reduce((a, e) => a + e.calories, 0);
            return (
              <Card key={meal} tilt reveal="scale">
                <div className="mb-2 flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <h3 className="text-[1.0625rem] font-semibold tracking-tight">{label(meal)}</h3>
                  <span className="tnum font-mono text-sm text-signal-300">{kcal} kcal</span>
                </div>
                <ul>
                  {entries.map((e) => (
                    <li key={e.id} className="row group/row">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-ink-100">{e.foodName}</div>
                        <div className="tnum mt-0.5 text-xs text-ink-500">
                          P {e.proteinG} · C {e.carbsG} · F {e.fatG}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tnum font-mono text-sm text-ink-200">{e.calories}</span>
                        <button
                          className="btn-danger transition-opacity sm:opacity-50 sm:group-hover/row:opacity-100 sm:focus-visible:opacity-100"
                          onClick={() => remove(e.id)}
                          aria-label={`Delete ${e.foodName}`}
                        >
                          <IconTrash size={15} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RemainingFigure({ remaining, over }) {
  const ref = useCountUp(Math.abs(remaining));
  return (
    <>
      <span
        ref={ref}
        className={`tnum block font-mono text-[2rem] font-bold leading-none ${over ? 'text-rose-300' : 'text-ink-50'}`}
      >
        0
      </span>
      <span className="mt-1.5 block text-[0.6875rem] uppercase tracking-[0.1em] text-ink-400">
        kcal {over ? 'over' : 'left'}
      </span>
    </>
  );
}
