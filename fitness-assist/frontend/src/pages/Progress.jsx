import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api, { errMsg, todayStr } from '../api.js';
import { useReveal, refreshMotion, reducedMotion } from '../lib/motion.js';
import { CHART, ChartTooltip, activeDot, axis, cursor, grid } from '../lib/chartTheme.jsx';
import {
  Card,
  Chip,
  Empty,
  ErrorBox,
  Field,
  PageHeader,
  Panel,
  Stat,
  TableWrap,
} from '../components/ui.jsx';
import { IconChart, IconScale, IconTrash } from '../components/icons.jsx';

const emptyMetric = { date: todayStr(), weightKg: '', waistCm: '', chestCm: '', hipsCm: '', armCm: '', thighCm: '' };
const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

/** Recharts animates by default and ignores the OS motion preference. */
const anim = () => ({ isAnimationActive: !reducedMotion(), animationDuration: 900 });

/** Volume runs into five figures; axis ticks read better as 22k than 22625. */
const kilos = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : n);

const METRIC_FIELDS = [
  ['weightKg', 'Weight', 'kg'],
  ['waistCm', 'Waist', 'cm'],
  ['chestCm', 'Chest', 'cm'],
  ['hipsCm', 'Hips', 'cm'],
  ['armCm', 'Arm', 'cm'],
  ['thighCm', 'Thigh', 'cm'],
];

/** Fixed-height chart frame, so the panels line up and nothing jumps on load. */
function ChartFrame({ children, empty }) {
  return (
    <div className="h-64 sm:h-72">
      {empty ? (
        <div className="flex h-full items-center justify-center text-center text-sm text-ink-500">{empty}</div>
      ) : (
        <ResponsiveContainer>{children}</ResponsiveContainer>
      )}
    </div>
  );
}

export default function Progress() {
  const [days, setDays] = useState(90);
  const [weight, setWeight] = useState(null);
  const [volume, setVolume] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [exerciseId, setExerciseId] = useState('');
  const [strength, setStrength] = useState(null);
  const [form, setForm] = useState(emptyMetric);
  const [error, setError] = useState('');

  const loadAll = () => {
    api.get('/progress/weight', { params: { days } }).then((r) => setWeight(r.data)).catch((e) => setError(errMsg(e)));
    api.get('/progress/volume', { params: { weeks: 12 } }).then((r) => setVolume(r.data)).catch((e) => setError(errMsg(e)));
    api
      .get('/metrics', { params: { from: new Date(Date.now() - days * 86400000).toLocaleDateString('en-CA') } })
      .then((r) => setMetrics(r.data))
      .catch((e) => setError(errMsg(e)));
    api.get('/summaries/weekly').then((r) => setSummaries(r.data)).catch((e) => setError(errMsg(e)));
  };

  useEffect(loadAll, [days]);

  useEffect(() => {
    api.get('/exercises').then((r) => {
      setExercises(r.data);
      if (r.data.length) setExerciseId(r.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!exerciseId) return;
    api.get(`/progress/strength/${exerciseId}`).then((r) => setStrength(r.data)).catch((e) => setError(errMsg(e)));
  }, [exerciseId]);

  const scope = useReveal([metrics.length, summaries.length]);

  // Charts render after their data lands and change the page height.
  useEffect(() => {
    const t = setTimeout(refreshMotion, 350);
    return () => clearTimeout(t);
  }, [weight, volume, strength]);

  const setF = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const logMetric = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/metrics', {
        date: form.date,
        weightKg: Number(form.weightKg),
        waistCm: numOrNull(form.waistCm),
        chestCm: numOrNull(form.chestCm),
        hipsCm: numOrNull(form.hipsCm),
        armCm: numOrNull(form.armCm),
        thighCm: numOrNull(form.thighCm),
      });
      setForm({ ...emptyMetric, date: form.date });
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const removeMetric = async (id) => {
    try {
      await api.delete(`/metrics/${id}`);
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const generate = async () => {
    try {
      await api.post('/summaries/weekly/generate');
      loadAll();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const change = weight?.changeKg;

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader title="Progress" subtitle="Body weight, strength per exercise and weekly training volume.">
        <select
          className="input w-auto"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Time range"
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
          <option value={180}>Last 6 months</option>
          <option value={365}>Last year</option>
        </select>
      </PageHeader>

      <ErrorBox message={error} />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Body weight */}
        <Panel
          reveal="left"
          title="Body weight"
          action={
            change != null && (
              <Chip tone={change > 0 ? 'warn' : 'signal'}>
                {change > 0 ? '+' : ''}
                {change} kg this period
              </Chip>
            )
          }
        >
          <ChartFrame empty={!weight?.points?.length && 'No weigh-ins in this period yet.'}>
            <AreaChart data={weight?.points || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.signal} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CHART.signal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...grid} />
              <XAxis dataKey="date" {...axis} minTickGap={28} />
              <YAxis domain={['auto', 'auto']} {...axis} width={52} />
              <Tooltip content={<ChartTooltip unit=" kg" />} cursor={{ stroke: CHART.grid }} />
              <Area
                type="monotone"
                dataKey="weightKg"
                name="Weight"
                stroke={CHART.signal}
                strokeWidth={2}
                fill="url(#weightFill)"
                dot={false}
                activeDot={{ ...activeDot, fill: CHART.signal }}
                {...anim()}
              />
            </AreaChart>
          </ChartFrame>
          {/* Mirrors the strength card's legend row, and keeps the two level. */}
          <div className="tnum mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/[0.06] pt-3 text-xs text-ink-400">
            {weight?.points?.length ? (
              <>
                <span>
                  First <span className="font-mono text-ink-200">{weight.points[0].weightKg} kg</span>
                </span>
                <span>
                  Latest{' '}
                  <span className="font-mono text-ink-200">
                    {weight.points[weight.points.length - 1].weightKg} kg
                  </span>
                </span>
                <span>
                  {weight.points.length} {weight.points.length === 1 ? 'weigh-in' : 'weigh-ins'}
                </span>
              </>
            ) : (
              <span>Log a weight below to start this chart.</span>
            )}
          </div>
        </Panel>

        {/* Strength */}
        <Panel
          reveal="right"
          title="Strength"
          action={
            <select
              className="input w-auto max-w-[12rem]"
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              aria-label="Exercise"
            >
              {exercises.map((x) => (
                <option key={x.id} value={x.id}>{x.name}</option>
              ))}
            </select>
          }
        >
          <ChartFrame empty={!strength?.points?.length && 'No sets logged for this exercise yet.'}>
            <LineChart data={strength?.points || []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...grid} />
              <XAxis dataKey="date" {...axis} minTickGap={28} />
              <YAxis {...axis} width={52} />
              <Tooltip content={<ChartTooltip unit=" kg" />} cursor={{ stroke: CHART.grid }} />
              <Line
                type="monotone"
                dataKey="bestEstimated1Rm"
                name="Est. 1RM"
                stroke={CHART.signal}
                strokeWidth={2}
                dot={false}
                activeDot={{ ...activeDot, fill: CHART.signal }}
                {...anim()}
              />
              <Line
                type="monotone"
                dataKey="maxWeightKg"
                name="Top weight"
                stroke={CHART.cool}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
                activeDot={{ ...activeDot, fill: CHART.cool }}
                {...anim()}
              />
            </LineChart>
          </ChartFrame>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-white/[0.06] pt-3 text-xs text-ink-400">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: CHART.signal }} />
              Estimated 1RM
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: CHART.cool }} />
              Top weight
            </span>
          </div>
        </Panel>

        {/* Volume */}
        <Panel reveal="" title="Weekly training volume" note="Last 12 weeks" className="xl:col-span-2">
          <ChartFrame empty={!volume.length && 'No finished workouts yet.'}>
            <BarChart data={volume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.signalLight} />
                  <stop offset="100%" stopColor={CHART.signal} stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid {...grid} />
              <XAxis dataKey="weekStart" {...axis} minTickGap={16} />
              <YAxis {...axis} width={56} tickFormatter={kilos} />
              <Tooltip content={<ChartTooltip unit=" kg" />} cursor={cursor} />
              <Bar
                dataKey="volume"
                name="Volume"
                fill="url(#volFill)"
                radius={[5, 5, 0, 0]}
                maxBarSize={56}
                {...anim()}
              />
            </BarChart>
          </ChartFrame>
        </Panel>
      </div>

      {/* Log metrics */}
      <Panel reveal="" title="Log body metrics" note="One entry per day — logging the same date again updates it.">
        <form onSubmit={logMetric} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
            <Field label="Date">
              <input className="input" type="date" max={todayStr()} value={form.date} onChange={setF('date')} />
            </Field>
            {METRIC_FIELDS.map(([key, name, unit]) => (
              <Field key={key} label={`${name} (${unit})`}>
                <input
                  className="input tnum"
                  type="number"
                  step="0.1"
                  min={key === 'weightKg' ? 20 : undefined}
                  required={key === 'weightKg'}
                  value={form[key]}
                  onChange={setF(key)}
                />
              </Field>
            ))}
          </div>
          <button className="btn">Save entry</button>
        </form>
      </Panel>

      {/* Metric history */}
      <Panel reveal="" title="Metric history" note={metrics.length ? `${metrics.length} entries` : undefined}>
        {metrics.length === 0 ? (
          <Empty icon={IconScale} title="No measurements in this period">
            Log one above to start the weight chart.
          </Empty>
        ) : (
          <TableWrap>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="th">Date</th>
                  {METRIC_FIELDS.map(([key, name]) => (
                    <th key={key} className="th">{name}</th>
                  ))}
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {[...metrics].reverse().map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="td font-mono text-xs text-ink-300">{m.date}</td>
                    {METRIC_FIELDS.map(([key]) => (
                      <td key={key} className="td font-mono">
                        {m[key] ?? <span className="text-ink-600">—</span>}
                      </td>
                    ))}
                    <td className="td text-right">
                      <button className="btn-danger" onClick={() => removeMetric(m.id)} aria-label={`Delete entry for ${m.date}`}>
                        <IconTrash size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Panel>

      {/* Weekly summaries */}
      <Panel
        reveal=""
        title="Weekly consistency"
        action={
          <button className="btn-ghost btn-sm" onClick={generate}>
            Update this week
          </button>
        }
      >
        {summaries.length === 0 ? (
          <Empty icon={IconChart} title="No summaries yet">
            Generate this week&apos;s now, or wait for Monday&apos;s scheduled run.
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaries.map((s) => (
              <Card key={s.id} tilt className="bg-ink-800/40 p-4 sm:p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="tnum font-mono text-xs text-ink-400">
                    {s.weekStart} → {s.weekEnd}
                  </span>
                  <span className="tnum font-mono text-xl font-bold text-signal-300">{s.consistencyScore}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-3">
                  <Stat title="Workouts" value={s.workoutsCompleted} />
                  <Stat title="Volume" value={s.totalVolume} unit="kg" />
                  <Stat title="Days logged" value={s.daysFoodLogged} unit="/ 7" />
                  <Stat title="Avg intake" value={s.avgDailyCalories} unit="kcal" />
                </div>
                {s.weightChangeKg != null && (
                  <p className="tnum mt-3 text-xs text-ink-400">
                    Weight change {s.weightChangeKg > 0 ? '+' : ''}
                    {s.weightChangeKg} kg
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
