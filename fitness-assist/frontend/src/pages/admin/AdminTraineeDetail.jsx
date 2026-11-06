import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api, { errMsg } from '../../api.js';
import { useReveal, reducedMotion } from '../../lib/motion.js';
import { CHART, ChartTooltip, activeDot, axis, grid } from '../../lib/chartTheme.jsx';
import { Card, Chip, Empty, ErrorBox, Field, Panel, ProgressBar, Skeleton, Stat, label } from '../../components/ui.jsx';
import { IconArrow, IconCheck, IconDatabase, IconEdit, IconKey, IconPause, IconPulse, IconScale, IconTrash } from '../../components/icons.jsx';
import { ACTIVITY } from '../Register.jsx';
import { Avatar, ConfirmModal, EngagementChip, GOAL_LABEL, Modal, fmtDate, lastSeen, signed } from './shared.jsx';

const ACTIVITY_LABEL = Object.fromEntries(ACTIVITY.map(([v, l]) => [v, l.split(' — ')[0]]));
const anim = () => ({ isAnimationActive: !reducedMotion(), animationDuration: 900 });

export default function AdminTraineeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [notesState, setNotesState] = useState('idle'); // idle | saving | saved
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setData(null);
    api
      .get(`/admin/trainees/${id}`)
      .then((r) => {
        setData(r.data);
        setNotes(r.data.coachNotes || '');
      })
      .catch((e) => setError(errMsg(e)));
  }, [id]);

  const scope = useReveal([!!data]);

  const toggleActive = async () => {
    setError('');
    try {
      const { data: row } = await api.put(`/admin/trainees/${id}/status`, { active: !data.stats.active });
      setData({ ...data, stats: row });
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const saveNotes = async () => {
    setNotesState('saving');
    setError('');
    try {
      const { data: r } = await api.put(`/admin/trainees/${id}/notes`, { notes });
      setNotes(r.notes);
      setData((d) => ({ ...d, coachNotes: r.notes }));
      setNotesState('saved');
      setTimeout(() => setNotesState('idle'), 2500);
    } catch (e) {
      setError(errMsg(e));
      setNotesState('idle');
    }
  };

  if (!data) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorBox message={error} />
        {!error && (
          <>
            <Skeleton className="h-40 rounded-card" />
            <div className="grid gap-5 lg:grid-cols-2">
              <Skeleton className="h-72 rounded-card" />
              <Skeleton className="h-72 rounded-card" />
            </div>
          </>
        )}
      </div>
    );
  }

  const { profile: p, stats: s } = data;
  const weights = data.weightHistory;
  const notesDirty = notes !== (data.coachNotes || '');

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <BackLink />

      {/* Header */}
      <Card reveal="">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={p.name} size="h-14 w-14 text-base" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-title font-bold">{p.name}</h1>
                <EngagementChip value={s.engagement} />
              </div>
              <p className="mt-1 truncate text-sm text-ink-400">
                {p.email} · Joined {fmtDate(s.joinedAt)} · Last active {lastSeen(s.daysSinceActive).toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link className="btn-ghost" to={`/admin/data/users?edit=${id}`}>
              <IconEdit size={16} />
              Edit profile
            </Link>
            <button className="btn-ghost" onClick={() => setResetOpen(true)}>
              <IconKey size={16} />
              Reset password
            </button>
            <button className="btn-ghost" onClick={toggleActive}>
              {s.active ? <IconPause size={16} /> : <IconCheck size={16} />}
              {s.active ? 'Suspend' : 'Reactivate'}
            </button>
            <button className="btn-ghost text-rose-300 hover:border-rose-400/40 hover:text-rose-200" onClick={() => setConfirmDelete(true)}>
              <IconTrash size={16} />
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorBox message={error} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/[0.07] pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <Stat title="Workouts" value={s.totalWorkouts} hint={`${s.totalVolume.toLocaleString()} kg total`} />
          <Stat title="This week" value={s.workoutsLast7Days} unit={`/ ${s.weeklyWorkoutTarget}`} hint="Last 7 days" />
          <Stat title="Current weight" value={s.currentWeightKg ?? 0} decimals={1} unit="kg" hint={`Started at ${s.startWeightKg ?? '—'} kg`} />
          <Stat title="Change" value={Math.abs(s.weightChangeKg ?? 0)} decimals={1} unit="kg" hint={s.weightChangeKg == null ? 'One weigh-in so far' : s.weightChangeKg > 0 ? 'Gained' : s.weightChangeKg < 0 ? 'Lost' : 'No change'} />
          <Stat title="Consistency" value={s.consistencyScore ?? 0} unit="/ 100" hint={s.consistencyScore == null ? 'No weekly summary yet' : 'Latest week'} />
          <Stat title="Calories" value={p.dailyCalorieTarget} unit="kcal" hint="Daily target" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile */}
        <Panel reveal="" title="Profile">
          <dl className="-mt-1 text-sm">
            {[
              ['Goal', GOAL_LABEL[p.goal] || p.goal],
              ['Sex', label(p.sex)],
              ['Age', `${p.age}`],
              ['Height', `${p.heightCm} cm`],
              ['Activity', ACTIVITY_LABEL[p.activityLevel] || label(p.activityLevel)],
              ['Weekly target', `${p.weeklyWorkoutTarget} workouts`],
              ['Macros', `P ${p.proteinTargetG}g · C ${p.carbsTargetG}g · F ${p.fatTargetG}g`],
            ].map(([k, v]) => (
              <div key={k} className="row">
                <dt className="text-ink-400">{k}</dt>
                <dd className="text-right font-medium text-ink-100">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-ink-400">
              <span>Weekly workout goal</span>
              <span className="tnum">{s.workoutsLast7Days} / {s.weeklyWorkoutTarget}</span>
            </div>
            <ProgressBar value={s.workoutsLast7Days} max={s.weeklyWorkoutTarget} />
          </div>
        </Panel>

        {/* Weight */}
        <Panel
          reveal=""
          title="Weight trend"
          note={`${weights.length} weigh-in${weights.length === 1 ? '' : 's'}`}
          className="lg:col-span-2"
          action={s.weightChangeKg != null && <Chip tone={s.weightChangeKg === 0 ? 'default' : 'signal'}>{signed(s.weightChangeKg, ' kg')} overall</Chip>}
        >
          <div className="h-64">
            {weights.length < 2 ? (
              <Empty icon={IconScale} title="Not enough weigh-ins yet">
                The chart appears once the trainee logs a second body-weight entry.
              </Empty>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={weights} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminWeightFill" x1="0" y1="0" x2="0" y2="1">
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
                    fill="url(#adminWeightFill)"
                    dot={false}
                    activeDot={{ ...activeDot, fill: CHART.signal }}
                    {...anim()}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent workouts */}
        <Panel reveal="" title="Recent workouts" note="Last 10 sessions">
          {data.recentSessions.length === 0 ? (
            <Empty icon={IconPulse} title="No workouts logged yet" />
          ) : (
            <ul className="-mb-1">
              {data.recentSessions.map((w) => (
                <li key={w.id} className="row">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink-100">{w.name}</div>
                    <div className="mt-0.5 text-xs text-ink-500">
                      {fmtDate(w.startedAt)} · {w.sets} sets{w.durationMinutes != null && ` · ${w.durationMinutes} min`}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {!w.finished && <Chip tone="warn">In progress</Chip>}
                    <span className="tnum font-mono text-sm text-ink-300">{w.totalVolume.toLocaleString()} kg</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Coach notes */}
        <Panel reveal="" title="Coach notes" note="Only admins can see these">
          <textarea
            className="input min-h-[11rem] resize-y leading-relaxed"
            maxLength={2000}
            placeholder="Injuries, preferences, check-in reminders, programme changes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="tnum text-xs text-ink-500">{notes.length} / 2000</span>
            <div className="flex items-center gap-3">
              {notesState === 'saved' && (
                <span className="inline-flex items-center gap-1 text-sm text-signal-300">
                  <IconCheck size={15} /> Saved
                </span>
              )}
              <button className="btn btn-sm" disabled={!notesDirty || notesState === 'saving'} onClick={saveNotes}>
                {notesState === 'saving' ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* Weekly summaries */}
      <Panel reveal="" title="Weekly summaries" note="Generated every Monday, or when the trainee builds one">
        {data.weeklySummaries.length === 0 ? (
          <Empty title="No weekly summaries yet" />
        ) : (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[40rem]">
              <thead>
                <tr>
                  <th className="th">Week of</th>
                  <th className="th text-right">Workouts</th>
                  <th className="th text-right">Volume</th>
                  <th className="th text-right">Days logged</th>
                  <th className="th text-right">Avg kcal</th>
                  <th className="th text-right">Weight Δ</th>
                  <th className="th text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {data.weeklySummaries.map((w) => (
                  <tr key={w.id}>
                    <td className="td">{fmtDate(w.weekStart)}</td>
                    <td className="td tnum text-right font-mono">{w.workoutsCompleted}</td>
                    <td className="td tnum text-right font-mono">{w.totalVolume.toLocaleString()} kg</td>
                    <td className="td tnum text-right font-mono">{w.daysFoodLogged} / 7</td>
                    <td className="td tnum text-right font-mono">{w.avgDailyCalories}</td>
                    <td className="td tnum text-right font-mono">{signed(w.weightChangeKg, ' kg')}</td>
                    <td className={`td tnum text-right font-mono ${w.consistencyScore >= 70 ? 'text-signal-300' : ''}`}>
                      {w.consistencyScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* Direct access to this trainee's rows in every table. */}
      <Panel reveal="" title="Manage this trainee's records" note="Opens the database editor filtered to this trainee">
        <div className="flex flex-wrap gap-2">
          {[
            ['workoutSessions', 'Workout sessions'],
            ['routines', 'Routines'],
            ['foodLogs', 'Food logs'],
            ['bodyMetrics', 'Body metrics'],
            ['dailyTargets', 'Daily targets'],
            ['weeklySummaries', 'Weekly summaries'],
          ].map(([t, l]) => (
            <Link key={t} to={`/admin/data/${t}?user=${id}`} className="btn-ghost btn-sm">
              <IconDatabase size={14} />
              {l}
            </Link>
          ))}
        </div>
      </Panel>

      <ResetPasswordModal open={resetOpen} onClose={() => setResetOpen(false)} traineeId={id} name={p.name} />

      <ConfirmModal
        open={confirmDelete}
        title="Delete trainee?"
        confirmLabel="Delete permanently"
        onClose={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await api.delete(`/admin/trainees/${id}`);
          navigate('/admin/trainees', { replace: true });
        }}
      >
        <p>
          This removes <strong className="text-ink-50">{p.name}</strong> and every workout, routine, meal and
          measurement they have logged. It cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/trainees" className="link inline-flex items-center gap-1.5 text-sm">
      <IconArrow size={14} className="rotate-180" />
      All trainees
    </Link>
  );
}

function ResetPasswordModal({ open, onClose, traineeId, name }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
      setDone(false);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/admin/trainees/${traineeId}/password`, { password });
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} title={`Reset password for ${name}`} onClose={onClose} width="max-w-md">
      {done ? (
        <div className="space-y-5 text-sm text-ink-300">
          <p className="flex items-start gap-2 text-signal-200">
            <IconCheck size={16} className="mt-0.5" />
            <span>
              Password updated. Share it with {name}:{' '}
              <code className="rounded bg-ink-950/60 px-1.5 py-0.5 font-mono text-ink-50">{password}</code>
            </span>
          </p>
          <div className="flex justify-end">
            <button className="btn" onClick={onClose}>Done</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <ErrorBox message={error} />
          <Field label="New password" hint="At least 8 characters.">
            <input className="input font-mono" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2 border-t border-white/[0.06] pt-4">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn" disabled={busy}>{busy ? 'Saving…' : 'Set password'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
