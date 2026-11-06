import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../../api.js';
import { useReveal } from '../../lib/motion.js';
import { Empty, ErrorBox, PageHeader, Panel, Skeleton } from '../../components/ui.jsx';
import { IconCheck, IconDownload, IconPause, IconPlus, IconSearch, IconTrash, IconUsers } from '../../components/icons.jsx';
import { GOALS } from '../Register.jsx';
import {
  AddTraineeModal,
  Avatar,
  ConfirmModal,
  ENGAGEMENT,
  EngagementChip,
  GOAL_LABEL,
  exportCsv,
  lastSeen,
  signed,
} from './shared.jsx';

const SORTS = {
  recent: ['Newest first', (a, b) => (b.joinedAt || '').localeCompare(a.joinedAt || '')],
  name: ['Name A–Z', (a, b) => a.name.localeCompare(b.name)],
  active: ['Most active this week', (a, b) => b.workoutsLast7Days - a.workoutsLast7Days || b.volumeLast7Days - a.volumeLast7Days],
  quiet: ['Longest inactive', (a, b) => (b.daysSinceActive ?? 1e9) - (a.daysSinceActive ?? 1e9)],
  score: ['Consistency score', (a, b) => (b.consistencyScore ?? -1) - (a.consistencyScore ?? -1)],
  workouts: ['Total workouts', (a, b) => b.totalWorkouts - a.totalWorkouts],
};

const STATUS_TABS = ['ALL', 'ACTIVE', 'NEW', 'INACTIVE', 'SUSPENDED'];

export default function AdminTrainees() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const status = STATUS_TABS.includes(params.get('status')) ? params.get('status') : 'ALL';

  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [goal, setGoal] = useState('ALL');
  const [sort, setSort] = useState('recent');
  const [adding, setAdding] = useState(false);
  const [created, setCreated] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = () => api.get('/admin/trainees').then((r) => setRows(r.data)).catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = { ALL: rows?.length || 0 };
    rows?.forEach((r) => (c[r.engagement] = (c[r.engagement] || 0) + 1));
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => status === 'ALL' || r.engagement === status)
      .filter((r) => goal === 'ALL' || r.goal === goal)
      .filter((r) => !needle || r.name.toLowerCase().includes(needle) || r.email.includes(needle))
      .sort(SORTS[sort][1]);
  }, [rows, q, status, goal, sort]);

  const scope = useReveal([!!rows]);

  const replaceRow = (row) => setRows((rs) => rs.map((r) => (r.id === row.id ? row : r)));

  const toggleActive = async (r, e) => {
    e.stopPropagation();
    setError('');
    try {
      const { data } = await api.put(`/admin/trainees/${r.id}/status`, { active: !r.active });
      replaceRow(data);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const setStatus = (s) => {
    const next = new URLSearchParams(params);
    s === 'ALL' ? next.delete('status') : next.set('status', s);
    setParams(next, { replace: true });
  };

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader title="Trainees" subtitle="Everyone you coach, with this week's activity and their progress so far.">
        <button className="btn-ghost" disabled={!visible.length} onClick={() => exportCsv(visible)}>
          <IconDownload size={16} />
          Export CSV
        </button>
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
          <button className="link ml-auto" onClick={() => setCreated(null)}>
            Dismiss
          </button>
        </div>
      )}

      <Panel reveal="">
        {/* Status tabs */}
        <div className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto px-1">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                status === s ? 'bg-white/[0.08] text-ink-50' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              {s === 'ALL' ? 'All' : ENGAGEMENT[s].label}
              <span className="tnum ml-1.5 text-xs text-ink-500">{counts[s] || 0}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              className="input pl-10"
              placeholder="Search by name or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="input sm:w-44" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Goal">
            <option value="ALL">All goals</option>
            {GOALS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="input sm:w-52" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            {Object.entries(SORTS).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>

        {!rows ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : visible.length === 0 ? (
          <Empty
            icon={IconUsers}
            title={rows.length ? 'No trainees match these filters' : 'No trainees yet'}
            action={!rows.length && <button className="btn btn-sm" onClick={() => setAdding(true)}>Add the first one</button>}
          >
            {rows.length ? 'Try a different search or status.' : 'Trainees appear here when they sign up or you add them.'}
          </Empty>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
            <table className="w-full min-w-[60rem]">
              <thead>
                <tr>
                  <th className="th">Trainee</th>
                  <th className="th">Status</th>
                  <th className="th">Goal</th>
                  <th className="th text-right">This week</th>
                  <th className="th text-right">Workouts</th>
                  <th className="th text-right">Weight</th>
                  <th className="th text-right">Score</th>
                  <th className="th">Last active</th>
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const hit = r.workoutsLast7Days >= r.weeklyWorkoutTarget;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => navigate(`/admin/trainees/${r.id}`)}
                      className="group/row cursor-pointer transition-colors hover:bg-white/[0.025]"
                    >
                      <td className="td">
                        <div className="flex items-center gap-3">
                          <Avatar name={r.name} />
                          <div className="min-w-0">
                            <Link
                              to={`/admin/trainees/${r.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="block max-w-[14rem] truncate font-medium text-ink-100 group-hover/row:text-signal-300"
                            >
                              {r.name}
                            </Link>
                            <span className="block max-w-[14rem] truncate text-xs text-ink-500">{r.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="td"><EngagementChip value={r.engagement} /></td>
                      <td className="td text-ink-300">{GOAL_LABEL[r.goal] || r.goal}</td>
                      <td className={`td tnum text-right font-mono ${hit ? 'text-signal-300' : ''}`}>
                        {r.workoutsLast7Days} / {r.weeklyWorkoutTarget}
                      </td>
                      <td className="td tnum text-right font-mono">{r.totalWorkouts}</td>
                      <td className="td tnum text-right font-mono">
                        <div>{r.currentWeightKg ?? '—'} kg</div>
                        <div className="text-xs text-ink-500">{signed(r.weightChangeKg, ' kg')}</div>
                      </td>
                      <td className="td tnum text-right font-mono">{r.consistencyScore ?? '—'}</td>
                      <td className="td text-ink-300">{lastSeen(r.daysSinceActive)}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button
                            className="btn-danger hover:text-ink-100"
                            title={r.active ? 'Suspend account' : 'Reactivate account'}
                            onClick={(e) => toggleActive(r, e)}
                          >
                            {r.active ? <IconPause size={15} /> : <IconCheck size={15} />}
                            {r.active ? 'Suspend' : 'Activate'}
                          </button>
                          <button
                            className="btn-danger"
                            title="Delete trainee"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete(r);
                            }}
                          >
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {rows && visible.length > 0 && (
          <p className="mt-3 text-xs text-ink-500">
            Showing {visible.length} of {rows.length}
          </p>
        )}
      </Panel>

      <AddTraineeModal
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={(row, password) => {
          setCreated({ ...row, password });
          setRows((rs) => [row, ...(rs || [])]);
        }}
      />

      <ConfirmModal
        open={!!toDelete}
        title="Delete trainee?"
        confirmLabel="Delete permanently"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await api.delete(`/admin/trainees/${toDelete.id}`);
          setRows((rs) => rs.filter((r) => r.id !== toDelete.id));
        }}
      >
        <p>
          This removes <strong className="text-ink-50">{toDelete?.name}</strong> and every workout, routine, meal and
          measurement they have logged. It cannot be undone.
        </p>
        <p className="text-ink-500">To keep their history but block access, suspend the account instead.</p>
      </ConfirmModal>
    </div>
  );
}
