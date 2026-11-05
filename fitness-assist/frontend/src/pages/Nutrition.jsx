import { useEffect, useState } from 'react';
import api, { errMsg, todayStr } from '../api.js';
import { ErrorBox, Field, ProgressBar, label } from '../components/ui.jsx';

const MEALS = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const blank = { mealType: 'BREAKFAST', foodName: '', calories: '', proteinG: '', carbsG: '', fatG: '' };

export default function Nutrition() {
  const [date, setDate] = useState(todayStr());
  const [daily, setDaily] = useState(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');

  const load = () =>
    api.get('/nutrition/daily', { params: { date } }).then((r) => setDaily(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => { load(); }, [date]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <input type="date" className="input w-auto" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} />
      </div>
      <ErrorBox message={error} />

      {daily && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <span className="text-4xl font-bold">{Math.abs(remaining)}</span>
              <span className="ml-2 text-slate-500">kcal {remaining >= 0 ? 'remaining' : 'over target'}</span>
            </div>
            <div className="text-sm text-slate-500">{daily.consumed.calories} eaten of {daily.target.calories} kcal</div>
          </div>
          <ProgressBar value={daily.consumed.calories} max={daily.target.calories} over={daily.overCalorieTarget} />
          <div className="grid gap-4 sm:grid-cols-3">
            {[['Protein', 'proteinG'], ['Carbs', 'carbsG'], ['Fat', 'fatG']].map(([name, key]) => (
              <div key={key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium">{name}</span>
                  <span className="text-slate-500">{daily.consumed[key]} / {daily.target[key]} g</span>
                </div>
                <ProgressBar value={daily.consumed[key]} max={daily.target[key]} />
                <div className="mt-1 text-xs text-slate-400">{daily.remaining[key]} g left</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={add} className="card space-y-3">
        <h2 className="font-semibold">Add food</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Meal">
            <select className="input" value={form.mealType} onChange={set('mealType')}>
              {MEALS.map((m) => <option key={m} value={m}>{label(m)}</option>)}
            </select>
          </Field>
          <div className="lg:col-span-2">
            <Field label="Food"><input className="input" required value={form.foodName} onChange={set('foodName')} placeholder="2 eggs and toast" /></Field>
          </div>
          <Field label="Calories"><input className="input" type="number" min="0" required value={form.calories} onChange={set('calories')} /></Field>
          <Field label="Protein (g)"><input className="input" type="number" min="0" step="0.1" value={form.proteinG} onChange={set('proteinG')} /></Field>
          <Field label="Carbs (g)"><input className="input" type="number" min="0" step="0.1" value={form.carbsG} onChange={set('carbsG')} /></Field>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field label="Fat (g)"><input className="input" type="number" min="0" step="0.1" value={form.fatG} onChange={set('fatG')} /></Field>
          <button className="btn">Add</button>
        </div>
      </form>

      {daily && (
        <div className="space-y-4">
          {MEALS.map((meal) => {
            const entries = daily.entries.filter((e) => e.mealType === meal);
            if (entries.length === 0) return null;
            return (
              <div key={meal} className="card">
                <div className="mb-2 flex justify-between">
                  <h3 className="font-semibold">{label(meal)}</h3>
                  <span className="text-sm text-slate-500">{entries.reduce((a, e) => a + e.calories, 0)} kcal</span>
                </div>
                <ul className="divide-y divide-slate-100 text-sm">
                  {entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <div>{e.foodName}</div>
                        <div className="text-xs text-slate-500">P {e.proteinG} · C {e.carbsG} · F {e.fatG}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>{e.calories} kcal</span>
                        <button className="btn-danger" onClick={() => remove(e.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {daily.entries.length === 0 && <p className="text-sm text-slate-500">Nothing logged for this day.</p>}
        </div>
      )}
    </div>
  );
}
