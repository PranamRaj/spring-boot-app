import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../api.js';
import { useAuth } from '../../AuthContext.jsx';
import { useReveal, reducedMotion } from '../../lib/motion.js';
import { CHART, ChartTooltip, axis, cursor, grid } from '../../lib/chartTheme.jsx';
import { Card, Empty, ErrorBox, PageHeader, Panel, ProgressBar, Skeleton, Stat } from '../../components/ui.jsx';
import { IconArrow, IconCheck, IconPlus, IconTrophy, IconUsers } from '../../components/icons.jsx';
import { AddTraineeModal, Avatar, GOAL_LABEL, lastSeen } from './shared.jsx';

const anim = () => ({ isAnimationActive: !reducedMotion(), animationDuration: 900 });
const weekLabel = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const kilos = (n) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : n);

function WeeklyBars({ data, name, gradientId, light }) {
  const rows = data.map((d) => ({ week: weekLabel(d.weekStart), count: d.count }));
  const empty = rows.every((r) => r.count === 0);
  return (
    <div className="h-56">
      {empty ? (
        <div className="flex h-full items-center justify-center text-sm text-ink-500">Nothing in the last 8 weeks yet.</div>
      ) : (
        <ResponsiveContainer>
          <BarChart data={rows} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="100%" stopColor={light} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid {...grid} />
            <XAxis dataKey="week" {...axis} minTickGap={8} />
            <YAxis {...axis} allowDecimals={false} width={44} />
            <Tooltip content={<ChartTooltip />} cursor={cursor} />
            <Bar dataKey="count" name={name} fill={`url(#${gradientId})`} radius={[5, 5, 0, 0]} maxBarSize={44} {...anim()} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState(null);

  const load = () =>
    api.get('/admin/overview').then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, []);

  const scope = useReveal([!!data]);

  const goalTotal = data ? data.goals.reduce((s, g) => s + g.count, 0) : 0;

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Coach overview"
        subtitle={`Welcome back, ${user?.name?.split(' ')[0] || 'coach'}. Here is how your trainees are doing this week.`}
      >
        <Link to="/admin/trainees" className="btn-ghost">
          <IconUsers size={16} />
          All trainees
        </Link>
        <button className="btn" onClick={() => setAdding(true)}>
          <IconPlus size={16} />
          Add trainee
        </button>
      </PageHeader>

      <ErrorBox message={error} />

      {created && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-signal-400/25 bg-signal-400/[0.07] px-4 py-3 text-sm text-signal-200">
          <IconCheck size={16} />
          <span>
            <strong>{created.name}</strong> was added. Temporary password:{' '}
            <code className="rounded bg-ink-950/60 px-1.5 py-0.5 font-mono text-ink-50">{created.password}</code>
          </span>
          <Link to={`/admin/trainees/${created.id}`} className="link ml-auto">
            Open profile
          </Link>
        </div>
      )}

      {!data ? (
        <div className="space-y-5">
          <Skeleton className="h-28 rounded-card" />
          <div className="grid gap-5 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <Card reveal="">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
              <Stat title="Trainees" value={data.totalTrainees} hint={`${data.newLast30Days} joined in 30 days`} />
              <Stat
                title="Active this week"
                value={data.activeLast7Days}
                unit={`/ ${data.totalTrainees - data.suspended}`}
                hint={data.suspended ? `${data.suspended} suspended` : 'Trained or logged food'}
              />
              <Stat title="Workouts, 7 days" value={data.workoutsLast7Days} hint={`${kilos(data.volumeLast7Days)} kg lifted`} />
              <Stat
                title="Hitting target"
                value={data.targetHitRate}
                unit="%"
                hint={data.avgConsistency != null ? `Avg consistency ${data.avgConsistency}/100` : 'Of weekly workout goals'}
              />
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel reveal="" title="Workouts completed" note="All trainees, per week">
              <WeeklyBars data={data.workoutsByWeek} name="Workouts" gradientId="adminWorkouts" light={CHART.signalLight} />
            </Panel>
            <Panel reveal="" title="New sign-ups" note="Per week">
              <WeeklyBars data={data.signupsByWeek} name="Sign-ups" gradientId="adminSignups" light={CHART.cool} />
            </Panel>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            {/* Leaderboard */}
            <Panel reveal="" title="Top this week" note="By workouts, then volume" action={<IconTrophy size={18} className="text-signal-400" />}>
              {data.leaderboard.length === 0 ? (
                <Empty icon={IconTrophy} title="No workouts yet this week" />
              ) : (
                <ol className="-mb-1">
                  {data.leaderboard.map((r, i) => (
                    <li key={r.id} className="row cursor-pointer group/row" onClick={() => navigate(`/admin/trainees/${r.id}`)}>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`w-5 font-mono text-sm ${i === 0 ? 'text-signal-300' : 'text-ink-500'}`}>{i + 1}</span>
                        <Avatar name={r.name} size="h-8 w-8 text-[0.6875rem]" />
                        <span className="truncate font-medium text-ink-100 group-hover/row:text-signal-300">{r.name}</span>
                      </div>
                      <div className="tnum shrink-0 text-right font-mono text-xs text-ink-300">
                        <div className="text-sm text-ink-100">{r.workoutsLast7Days} / {r.weeklyWorkoutTarget}</div>
                        <div className="text-ink-500">{kilos(r.volumeLast7Days)} kg</div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>

            {/* Needs attention */}
            <Panel
              reveal=""
              title="Needs a check-in"
              note="No activity for 7+ days"
              action={
                <Link to="/admin/trainees?status=INACTIVE" className="link inline-flex items-center gap-1 text-sm">
                  View all <IconArrow size={14} />
                </Link>
              }
            >
              {data.needsAttention.length === 0 ? (
                <Empty icon={IconCheck} title="Everyone is on it">
                  No trainee has gone quiet for a week.
                </Empty>
              ) : (
                <ul className="-mb-1">
                  {data.needsAttention.map((r) => (
                    <li key={r.id} className="row cursor-pointer group/row" onClick={() => navigate(`/admin/trainees/${r.id}`)}>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={r.name} size="h-8 w-8 text-[0.6875rem]" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-ink-100 group-hover/row:text-signal-300">{r.name}</div>
                          <div className="truncate text-xs text-ink-500">{r.email}</div>
                        </div>
                      </div>
                      <span className="chip chip-warn shrink-0">{r.lastActive ? lastSeen(r.daysSinceActive) : 'Never logged'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>

            {/* Goals */}
            <Panel reveal="" title="Goals" note={`${goalTotal} trainee${goalTotal === 1 ? '' : 's'}`}>
              <div className="space-y-5">
                {data.goals.map((g) => (
                  <div key={g.goal}>
                    <div className="mb-1.5 flex items-baseline justify-between text-sm">
                      <span className="font-medium text-ink-200">{GOAL_LABEL[g.goal] || g.goal}</span>
                      <span className="tnum text-xs text-ink-400">
                        {g.count} · {goalTotal ? Math.round((g.count / goalTotal) * 100) : 0}%
                      </span>
                    </div>
                    <ProgressBar value={g.count} max={goalTotal} />
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </>
      )}

      <AddTraineeModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(row, password) => {
          setCreated({ ...row, password });
          load();
        }}
      />
    </div>
  );
}
