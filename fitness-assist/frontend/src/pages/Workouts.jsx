import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api.js';
import { useReveal } from '../lib/motion.js';
import { Card, Chip, Empty, ErrorBox, PageHeader, Panel, Skeleton, Stat } from '../components/ui.jsx';
import { IconArrow, IconLayers, IconPlus, IconPulse, IconTrash } from '../components/icons.jsx';

export default function Workouts() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');

  const load = () =>
    api
      .get('/workouts/sessions')
      .then((r) => setSessions(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const scope = useReveal([loading, sessions.length]);

  // Totals over everything loaded, so the figures always match the list below.
  const totals = useMemo(
    () =>
      sessions.reduce(
        (a, s) => ({
          volume: a.volume + (s.totalVolume || 0),
          sets: a.sets + (s.sets?.length || 0),
        }),
        { volume: 0, sets: 0 }
      ),
    [sessions]
  );

  const startBlank = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/workouts/sessions', { name: name || null });
      navigate(`/workouts/${data.id}`);
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this workout?')) return;
    try {
      await api.delete(`/workouts/sessions/${id}`);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const live = sessions.filter((s) => !s.finished);

  return (
    <div ref={scope} className="space-y-6 sm:space-y-8">
      <PageHeader title="Workouts" subtitle="Log sets as you train, or pick up a session you left open." />

      <ErrorBox message={error} />

      {/* Unfinished sessions get their own prompt rather than hiding in history. */}
      {live.length > 0 && (
        <Card reveal="" className="border-signal-400/20 bg-signal-400/[0.04]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-400" />
                </span>
                <h2 className="text-base font-semibold tracking-tight">
                  {live.length === 1 ? 'A workout is still open' : `${live.length} workouts still open`}
                </h2>
              </div>
              <p className="mt-1.5 text-sm text-ink-400">Finish it to count it towards this week&apos;s consistency.</p>
            </div>
            <Link to={`/workouts/${live[0].id}`} className="btn">
              Resume {live[0].name}
              <IconArrow size={16} />
            </Link>
          </div>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Panel reveal="left" title="Start an empty workout" note="Name it now or leave it blank and log as you go.">
          <form onSubmit={startBlank} className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input flex-1"
              placeholder="Workout name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Workout name"
            />
            <div className="flex gap-3">
              <button className="btn flex-1 sm:flex-none">
                <IconPlus size={16} />
                Start
              </button>
              <Link to="/routines" className="btn-ghost flex-1 justify-center sm:flex-none">
                <IconLayers size={16} />
                From a routine
              </Link>
            </div>
          </form>
        </Panel>

        <Panel reveal="right" title="All time">
          {loading ? (
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Stat title="Sessions" value={sessions.length} />
              <Stat title="Sets" value={totals.sets} />
              <Stat title="Volume" value={totals.volume} unit="kg" />
            </div>
          )}
        </Panel>
      </div>

      <Panel reveal="" title="History" note={sessions.length ? `${sessions.length} logged` : undefined}>
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Empty icon={IconPulse} title="Nothing logged yet">
            Start an empty workout above, or run one of your routines.
          </Empty>
        ) : (
          <ul>
            {sessions.map((s) => (
              <li key={s.id} className="row group/row flex-col items-stretch gap-1">
                {/* Title and delete share the top line at every width; the
                    metadata wraps underneath rather than being truncated. */}
                <div className="flex items-center gap-3">
                  <Link
                    to={`/workouts/${s.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <span className="truncate font-medium text-ink-100 transition-colors group-hover/row:text-signal-300">
                      {s.name}
                    </span>
                    {!s.finished && <Chip tone="warn">In progress</Chip>}
                  </Link>
                  <button
                    className="btn-danger shrink-0"
                    onClick={() => remove(s.id)}
                    aria-label={`Delete ${s.name}`}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
                <div className="tnum flex flex-wrap items-center gap-x-2 gap-y-1 pr-8 text-xs text-ink-500">
                  <span>{new Date(s.startedAt).toLocaleString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>{s.sets.length} sets</span>
                  <span aria-hidden="true">·</span>
                  <span>{s.totalVolume} kg</span>
                  {s.durationMinutes != null && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{s.durationMinutes} min</span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
