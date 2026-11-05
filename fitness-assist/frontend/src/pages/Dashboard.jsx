import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { useReveal, useCountUp, useParallax } from '../lib/motion.js';
import {
  Card,
  Chip,
  Empty,
  ErrorBox,
  MacroMeter,
  PageHeader,
  Panel,
  Ring,
  Skeleton,
  Stat,
} from '../components/ui.jsx';
import { IconArrow, IconClock, IconFlame, IconPulse } from '../components/icons.jsx';

const MACROS = [
  ['Protein', 'proteinG'],
  ['Carbs', 'carbsG'],
  ['Fat', 'fatG'],
];

const today = () =>
  new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

export default function Dashboard() {
  const { user } = useAuth();
  const [daily, setDaily] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/nutrition/daily'),
      api.get('/workouts/sessions'),
      api.get('/summaries/weekly'),
    ])
      .then(([d, s, w]) => {
        setDaily(d.data);
        setSessions(s.data.slice(0, 5));
        setSummary(w.data[0] || null);
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  // Re-scan for reveal targets once the panels have real content in them.
  const scope = useReveal([loading, sessions.length, !!summary]);

  const remaining = daily?.remaining.calories ?? 0;
  const over = remaining < 0;

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader title={`Hi, ${user?.name?.split(' ')[0] || 'there'}`} subtitle={today()}>
        <Link to="/nutrition" className="btn-ghost">
          <IconFlame size={16} />
          Log food
        </Link>
        <Link to="/workouts" className="btn">
          <IconPulse size={16} />
          Start a workout
        </Link>
      </PageHeader>

      <ErrorBox message={error} />

      <div className="grid gap-5 xl:grid-cols-3">
        {/* Calories + macros */}
        <Card tilt reveal="" className="xl:col-span-2">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">Today&apos;s intake</h2>
            <Link to="/nutrition" className="link inline-flex items-center gap-1 text-sm">
              Details <IconArrow size={14} />
            </Link>
          </div>

          {loading ? <IntakeSkeleton /> : daily ? (
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-8">
              <Ring value={daily.consumed.calories} max={daily.target.calories}>
                <CalorieRing remaining={remaining} over={over} />
              </Ring>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] pb-3">
                  <span className="text-sm text-ink-400">Eaten of target</span>
                  <span className="tnum font-mono text-sm text-ink-100">
                    {daily.consumed.calories} / {daily.target.calories} kcal
                  </span>
                </div>
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
          ) : null}
        </Card>

        {/* Weekly consistency */}
        <Card tilt reveal="right">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight">Last week</h2>
            <Link to="/progress" className="link inline-flex items-center gap-1 text-sm">
              Details <IconArrow size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : summary ? (
            <ScoreBlock summary={summary} />
          ) : (
            <Empty icon={IconClock} title="No summary yet">
              One is generated each Monday — or build this week&apos;s now from the Progress page.
            </Empty>
          )}
        </Card>
      </div>

      {/* Recent workouts */}
      <Panel
        reveal=""
        title="Recent workouts"
        action={
          <Link to="/workouts" className="link inline-flex items-center gap-1 text-sm">
            All workouts <IconArrow size={14} />
          </Link>
        }
        bodyClass={sessions.length ? '-mb-1' : ''}
      >
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Empty
            icon={IconPulse}
            title="Nothing logged yet"
            action={
              <Link to="/routines" className="btn btn-sm">
                Build a routine
              </Link>
            }
          >
            Start from a routine or log an empty session as you go.
          </Empty>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="row group/row">
                <Link to={`/workouts/${s.id}`} className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink-100 transition-colors group-hover/row:text-signal-300">
                    {s.name}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-500">
                    {new Date(s.startedAt).toLocaleDateString()}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-3">
                  {!s.finished && <Chip tone="warn">In progress</Chip>}
                  <span className="tnum font-mono text-sm text-ink-300">{s.totalVolume} kg</span>
                  <IconArrow
                    size={15}
                    className="text-ink-600 transition-transform duration-300 group-hover/row:translate-x-1 group-hover/row:text-signal-400"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/** The figure inside the ring. Parallax gives the card a little depth on scroll. */
function CalorieRing({ remaining, over }) {
  const ref = useCountUp(Math.abs(remaining));
  const drift = useParallax(-14);
  return (
    <div ref={drift}>
      <span
        ref={ref}
        className={`tnum block font-mono text-3xl font-bold leading-none ${
          over ? 'text-rose-300' : 'text-ink-50'
        }`}
      >
        0
      </span>
      <span className="mt-1.5 block text-[0.6875rem] uppercase tracking-[0.1em] text-ink-400">
        kcal {over ? 'over' : 'left'}
      </span>
    </div>
  );
}

function ScoreBlock({ summary }) {
  const ref = useCountUp(summary.consistencyScore);
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span ref={ref} className="tnum font-mono text-5xl font-bold leading-none text-signal-300">
            0
          </span>
          <span className="font-mono text-lg text-ink-500">/100</span>
        </div>
        <p className="mt-2 text-sm text-ink-400">Consistency, week of {summary.weekStart}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 border-t border-white/[0.07] pt-4">
        <Stat title="Workouts" value={summary.workoutsCompleted} />
        <Stat title="Volume" value={summary.totalVolume} unit="kg" />
        <Stat title="Days logged" value={summary.daysFoodLogged} unit="/ 7" />
        <Stat title="Avg intake" value={summary.avgDailyCalories} unit="kcal" />
      </div>
    </div>
  );
}

function IntakeSkeleton() {
  return (
    <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-8">
      <Skeleton className="h-[132px] w-[132px] rounded-full" />
      <div className="flex-1 space-y-4">
        <Skeleton className="h-5 w-full" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
