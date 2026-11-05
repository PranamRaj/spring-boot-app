import { useEffect, useState } from 'react';
import api, { errMsg } from '../api.js';
import { useReveal } from '../lib/motion.js';
import { Card, Chip, Empty, ErrorBox, PageHeader, Skeleton, label } from '../components/ui.jsx';
import { IconSearch } from '../components/icons.jsx';
import ExerciseArt from '../components/exerciseArt.jsx';

export default function Exercises() {
  const [meta, setMeta] = useState({ muscleGroups: [], equipment: [] });
  const [filters, setFilters] = useState({ muscleGroup: '', equipment: '', q: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/exercises/meta').then((r) => setMeta(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    const t = setTimeout(() => {
      api
        .get('/exercises', { params })
        .then((r) => setItems(r.data))
        .catch((e) => setError(errMsg(e)))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [filters]);

  const scope = useReveal([items.length]);
  const set = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });
  const active = Object.values(filters).some(Boolean);

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Exercise library"
        subtitle="Filter by muscle group or by what you have to hand, then build it into a routine."
      />

      <ErrorBox message={error} />

      {/* Filters. Stack on a phone, three across from sm. */}
      <Card reveal="" className="sticky top-2 z-20 lg:top-4">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
          <div className="relative">
            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              className="input pl-10"
              placeholder="Search by name"
              value={filters.q}
              onChange={set('q')}
              aria-label="Search exercises"
            />
          </div>
          <select className="input" value={filters.muscleGroup} onChange={set('muscleGroup')} aria-label="Muscle group">
            <option value="">All muscle groups</option>
            {meta.muscleGroups.map((m) => (
              <option key={m} value={m}>{label(m)}</option>
            ))}
          </select>
          <select className="input" value={filters.equipment} onChange={set('equipment')} aria-label="Equipment">
            <option value="">All equipment</option>
            {meta.equipment.map((m) => (
              <option key={m} value={m}>{label(m)}</option>
            ))}
          </select>
        </div>

        {active && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
            <span className="tnum text-xs text-ink-400">
              {items.length} {items.length === 1 ? 'exercise' : 'exercises'}
            </span>
            <button
              className="btn-danger"
              onClick={() => setFilters({ muscleGroup: '', equipment: '', q: '' })}
            >
              Clear filters
            </button>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-card" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Empty icon={IconSearch} title="No exercises match those filters">
          Try a broader muscle group, or clear the search.
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <Card key={e.id} tilt reveal="scale" className="flex flex-col">
              {/* Illustration sits in its own inset panel so every card has the
                  same silhouette regardless of how long the description is. */}
              <div className="relative mb-4 overflow-hidden rounded-xl border border-white/[0.06] bg-ink-950/50 px-4 py-3">
                <ExerciseArt
                  name={e.name}
                  equipment={e.equipment}
                  className="text-ink-300 transition-colors duration-500 group-hover/card:text-ink-100"
                />
              </div>
              <h3 className="text-[0.975rem] font-semibold leading-snug text-ink-50">{e.name}</h3>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Chip tone="signal">{label(e.muscleGroup)}</Chip>
                <Chip>{label(e.equipment)}</Chip>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-400">{e.description}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
