import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../../api.js';
import { Card, Empty, ErrorBox, PageHeader, Skeleton, label as humanize } from '../../components/ui.jsx';
import {
  IconArrow,
  IconClose,
  IconDatabase,
  IconEdit,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
} from '../../components/icons.jsx';
import { ConfirmModal, Modal } from './shared.jsx';

/** Query params that control the view rather than filter rows. */
const VIEW_PARAMS = new Set(['q', 'page', 'size', 'sort', 'dir', 'edit', 'new']);
const PAGE_SIZES = [10, 25, 50, 100];

const fmtDateTime = (v) =>
  v ? new Date(v).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const fmtDay = (v) => (v ? new Date(`${v}T00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function DataManager() {
  const { table: tableKey } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [tables, setTables] = useState(null);
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch] = useState(params.get('q') || '');

  const loadTables = useCallback(
    () => api.get('/admin/data').then((r) => setTables(r.data)).catch((e) => setError(errMsg(e))),
    []
  );
  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const table = tables?.find((t) => t.key === tableKey);

  // Unknown or missing table: go to the first one.
  useEffect(() => {
    if (tables && !table) navigate(`/admin/data/${tables[0].key}`, { replace: true });
  }, [tables, table, navigate]);

  const filters = useMemo(() => {
    const f = {};
    params.forEach((v, k) => !VIEW_PARAMS.has(k) && v && (f[k] = v));
    return f;
  }, [params]);

  const pageNo = Number(params.get('page') || 0);
  const size = Number(params.get('size') || 25);
  const sort = params.get('sort') || '';
  const dir = params.get('dir') || 'desc';
  const q = params.get('q') || '';

  const update = (changes, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === '' || v === undefined ? next.delete(k) : next.set(k, v)));
    if (resetPage && !('page' in changes)) next.delete('page');
    setParams(next, { replace: true });
  };

  const loadRows = useCallback(() => {
    if (!table) return;
    setLoading(true);
    setError('');
    api
      .get(`/admin/data/${table.key}`, { params: { page: pageNo, size, q: q || undefined, sort: sort || undefined, dir, ...filters } })
      .then((r) => setPage(r.data))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.key, pageNo, size, q, sort, dir, JSON.stringify(filters)]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  // Keep the search box in sync when switching tables, and debounce typing into the URL.
  useEffect(() => setSearch(q), [tableKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => update({ q: search }), 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const afterChange = () => {
    loadRows();
    loadTables();
  };

  const columns = table ? table.fields.filter((f) => f.list && f.type !== 'PASSWORD') : [];
  const filterable = table ? table.fields.filter((f) => f.type === 'ENUM' || f.type === 'BOOLEAN') : [];
  const editId = params.get('edit');
  const creating = params.get('new') === '1';

  const groups = useMemo(() => {
    const g = {};
    tables?.forEach((t) => (g[t.group] = [...(g[t.group] || []), t]));
    return Object.entries(g);
  }, [tables]);

  const refFilterLabel = (field, id) => {
    const row = page?.rows.find((r) => r[field.name]?.id === Number(id));
    return row ? row[field.name].label : `#${id}`;
  };

  const toggleSort = (f) => {
    if (f.type === 'REF') return;
    if (sort === f.name) update({ dir: dir === 'asc' ? 'desc' : 'asc' });
    else update({ sort: f.name, dir: 'asc' });
  };

  const from = page && page.total ? page.page * page.size + 1 : 0;
  const to = page ? Math.min(page.total, (page.page + 1) * page.size) : 0;
  const lastPage = page ? Math.max(0, Math.ceil(page.total / page.size) - 1) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader
        title="Database"
        subtitle="Browse, search, add, edit and delete records in every table. Changes go straight to the database, with the app's rules applied."
      >
        <button className="btn-ghost" onClick={afterChange} title="Reload">
          <IconRefresh size={16} />
          Refresh
        </button>
        {table && (
          <button className="btn" onClick={() => update({ new: '1', edit: null }, { resetPage: false })}>
            <IconPlus size={16} />
            New {table.label.replace(/s$/, '').toLowerCase()}
          </button>
        )}
      </PageHeader>

      <div className="grid gap-5 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        {/* Table list */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <select
            className="input lg:hidden"
            value={tableKey || ''}
            onChange={(e) => navigate(`/admin/data/${e.target.value}`)}
            aria-label="Table"
          >
            {tables?.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label} ({t.count})
              </option>
            ))}
          </select>
          <Card reveal={false} className="hidden !p-3 lg:block">
            {!tables ? (
              <div className="space-y-2 p-1">
                {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              groups.map(([group, list]) => (
                <div key={group} className="mb-3 last:mb-0">
                  <div className="eyebrow px-2.5 pb-1.5 pt-1">{group}</div>
                  {list.map((t) => (
                    <Link
                      key={t.key}
                      to={`/admin/data/${t.key}`}
                      className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                        t.key === tableKey ? 'bg-signal-400 font-medium text-ink-950' : 'text-ink-300 hover:bg-white/[0.05] hover:text-ink-50'
                      }`}
                    >
                      <span className="truncate">{t.label}</span>
                      <span className={`tnum font-mono text-xs ${t.key === tableKey ? 'text-ink-900' : 'text-ink-500'}`}>{t.count}</span>
                    </Link>
                  ))}
                </div>
              ))
            )}
          </Card>
        </aside>

        {/* Rows */}
        <Card reveal={false} className="min-w-0">
          {table && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <IconDatabase size={17} className="text-signal-400" />
                <h2 className="text-base font-semibold tracking-tight">{table.label}</h2>
              </div>
              <p className="mt-0.5 text-xs text-ink-400">{table.description}</p>
            </div>
          )}

          <div className="mb-3 flex flex-wrap gap-3">
            <div className="relative min-w-[12rem] flex-1">
              <IconSearch size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
              <input className="input pl-10" placeholder="Search text columns or an id" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {filterable.map((f) => (
              <select
                key={f.name}
                className="input w-auto min-w-[9rem]"
                value={filters[f.name] || ''}
                onChange={(e) => update({ [f.name]: e.target.value })}
                aria-label={f.label}
              >
                <option value="">{f.label}: any</option>
                {(f.type === 'BOOLEAN' ? ['true', 'false'] : f.options).map((o) => (
                  <option key={o} value={o}>
                    {f.type === 'BOOLEAN' ? (o === 'true' ? 'Yes' : 'No') : humanize(o)}
                  </option>
                ))}
              </select>
            ))}
          </div>

          {/* Active reference filters, e.g. "User: Pranam Raj" from clicking a cell. */}
          {table && table.fields.some((f) => f.type === 'REF' && filters[f.name]) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {table.fields
                .filter((f) => f.type === 'REF' && filters[f.name])
                .map((f) => (
                  <span key={f.name} className="chip chip-signal">
                    {f.label}: {refFilterLabel(f, filters[f.name])}
                    <button onClick={() => update({ [f.name]: null })} aria-label={`Clear ${f.label} filter`}>
                      <IconClose size={12} />
                    </button>
                  </span>
                ))}
            </div>
          )}

          <ErrorBox message={error} />

          {!page || !table ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : page.rows.length === 0 ? (
            <Empty
              icon={IconDatabase}
              title={q || Object.keys(filters).length ? 'No records match' : 'This table is empty'}
              action={
                <button className="btn btn-sm" onClick={() => update({ new: '1' }, { resetPage: false })}>
                  Add a record
                </button>
              }
            />
          ) : (
            <div className={`-mx-5 overflow-x-auto px-5 transition-opacity sm:-mx-6 sm:px-6 ${loading ? 'opacity-60' : ''}`}>
              <table className="w-full">
                <thead>
                  <tr>
                    {[{ name: 'id', label: 'ID', type: 'INT' }, ...columns].map((f) => (
                      <th
                        key={f.name}
                        onClick={() => toggleSort(f)}
                        className={`th select-none ${f.type === 'REF' ? '' : 'cursor-pointer hover:text-ink-200'} ${
                          ['INT', 'DECIMAL'].includes(f.type) ? 'text-right' : ''
                        }`}
                      >
                        {f.label}
                        {(sort || 'id') === f.name && <span className="ml-1 text-signal-400">{dir === 'asc' ? '↑' : '↓'}</span>}
                      </th>
                    ))}
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {page.rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-white/[0.025]">
                      <td className="td tnum font-mono text-ink-500">{row.id}</td>
                      {columns.map((f) => (
                        <td key={f.name} className={`td ${['INT', 'DECIMAL'].includes(f.type) ? 'tnum text-right font-mono' : ''}`}>
                          <Cell field={f} value={row[f.name]} onFilter={(id) => update({ [f.name]: id })} />
                        </td>
                      ))}
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button className="btn-danger hover:text-ink-100" onClick={() => update({ edit: row.id, new: null }, { resetPage: false })}>
                            <IconEdit size={15} />
                            Edit
                          </button>
                          <button className="btn-danger" title="Delete" onClick={() => setToDelete(row)}>
                            <IconTrash size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {page && page.total > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-sm text-ink-400">
              <span className="tnum">
                {from}–{to} of {page.total}
              </span>
              <div className="flex items-center gap-2">
                <select
                  className="input w-auto py-1.5 text-xs"
                  value={size}
                  onChange={(e) => update({ size: e.target.value })}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZES.map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
                <button className="btn-ghost btn-sm" disabled={pageNo === 0} onClick={() => update({ page: pageNo - 1 })}>
                  Previous
                </button>
                <span className="tnum text-xs">
                  {pageNo + 1} / {lastPage + 1}
                </span>
                <button className="btn-ghost btn-sm" disabled={pageNo >= lastPage} onClick={() => update({ page: pageNo + 1 })}>
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {table && (creating || editId) && (
        <RecordEditor
          key={`${table.key}-${editId || 'new'}`}
          table={table}
          tables={tables}
          id={editId}
          defaults={filters}
          onClose={() => update({ edit: null, new: null }, { resetPage: false })}
          onSaved={afterChange}
          onDelete={(row) => setToDelete(row)}
        />
      )}

      <ConfirmModal
        open={!!toDelete}
        title={`Delete ${table?.label.replace(/s$/, '').toLowerCase()} #${toDelete?.id}?`}
        confirmLabel="Delete"
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          await api.delete(`/admin/data/${table.key}/${toDelete.id}`);
          if (String(toDelete.id) === editId) update({ edit: null }, { resetPage: false });
          afterChange();
        }}
      >
        <p>
          <strong className="text-ink-50">{toDelete?._label}</strong> will be removed permanently.
          {table?.key === 'users' && ' All of this user’s workouts, routines, meals, measurements and summaries are deleted with it.'}
          {table?.key === 'workoutSessions' && ' Its sets are deleted with it.'}
          {table?.key === 'routines' && ' Its exercises are deleted with it.'}
        </p>
      </ConfirmModal>
    </div>
  );
}

/* --------------------------------------------------------------- cells */

function Cell({ field: f, value, onFilter }) {
  if (value === null || value === undefined || value === '') return <span className="text-ink-600">—</span>;
  switch (f.type) {
    case 'REF':
      return (
        <button
          onClick={() => onFilter(value.id)}
          title={`Show only rows for ${value.label}`}
          className="max-w-[14rem] truncate text-left text-ink-100 underline decoration-white/20 underline-offset-4 hover:text-signal-300 hover:decoration-signal-400"
        >
          {value.label}
        </button>
      );
    case 'BOOLEAN':
      return <span className={`chip ${value ? 'chip-signal' : ''}`}>{value ? 'Yes' : 'No'}</span>;
    case 'ENUM':
      return <span className="text-ink-200">{humanize(value)}</span>;
    case 'DATE':
      return fmtDay(value);
    case 'DATETIME':
      return <span className="text-ink-300">{fmtDateTime(value)}</span>;
    case 'DECIMAL':
      return Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
    case 'TEXT':
      return <span className="block max-w-[16rem] truncate text-ink-300" title={value}>{value}</span>;
    default:
      return <span className="block max-w-[16rem] truncate" title={String(value)}>{String(value)}</span>;
  }
}

/* -------------------------------------------------------------- editor */

const toInput = (f, v) => {
  if (v === null || v === undefined) return f.type === 'BOOLEAN' ? false : '';
  if (f.type === 'DATETIME') return String(v).slice(0, 16);
  return v;
};

function RecordEditor({ table, tables, id, defaults, onClose, onSaved, onDelete }) {
  const isNew = !id;
  const [row, setRow] = useState(null);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isNew) {
      const v = {};
      table.fields.forEach((f) => {
        if (f.type === 'BOOLEAN') v[f.name] = true;
        else if (f.type === 'ENUM' && f.required) v[f.name] = defaults[f.name] || f.options[0];
        else if (f.type === 'REF') v[f.name] = defaults[f.name] ? { id: Number(defaults[f.name]), label: `#${defaults[f.name]}` } : null;
        else if (f.type === 'DATE') v[f.name] = f.required ? new Date().toLocaleDateString('en-CA') : '';
        else if (f.type === 'DATETIME' && f.required) v[f.name] = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        else v[f.name] = '';
      });
      setValues(v);
      // Resolve labels for references pre-filled from the current filter.
      table.fields
        .filter((f) => f.type === 'REF' && defaults[f.name])
        .forEach((f) =>
          api.get(`/admin/data/${f.ref}/${defaults[f.name]}`).then((r) =>
            setValues((cur) => ({ ...cur, [f.name]: { id: r.data.id, label: r.data._label } }))
          ).catch(() => {})
        );
    } else {
      api
        .get(`/admin/data/${table.key}/${id}`)
        .then((r) => {
          setRow(r.data);
          const v = {};
          table.fields.forEach((f) => (v[f.name] = toInput(f, r.data[f.name])));
          setValues(v);
        })
        .catch((e) => setError(errMsg(e)));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (name, v) => {
    setValues((cur) => ({ ...cur, [name]: v }));
    setErrors((cur) => ({ ...cur, [name]: undefined }));
    setSaved(false);
  };

  const editable = (f) => !f.readOnly && !(f.createOnly && !isNew);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    const body = {};
    table.fields.filter(editable).forEach((f) => {
      const v = values[f.name];
      body[f.name] = f.type === 'REF' ? v?.id ?? null : v === '' ? null : v;
    });
    try {
      const { data } = isNew
        ? await api.post(`/admin/data/${table.key}`, body)
        : await api.put(`/admin/data/${table.key}/${id}`, body);
      onSaved();
      if (isNew) {
        onClose();
      } else {
        setRow(data);
        const v = {};
        table.fields.forEach((f) => (v[f.name] = toInput(f, data[f.name])));
        setValues(v);
        setSaved(true);
      }
    } catch (err) {
      setErrors(err.response?.data?.fieldErrors || {});
      setError(err.response?.data?.fieldErrors ? 'Please fix the highlighted fields.' : errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  // Other tables that point at this one, e.g. a user's food logs or a session's sets.
  const related = !isNew
    ? tables.flatMap((t) => t.fields.filter((f) => f.type === 'REF' && f.ref === table.key).map((f) => ({ t, f })))
    : [];

  const singular = table.label.replace(/s$/, '').toLowerCase();

  return (
    <Modal open title={isNew ? `New ${singular}` : `${table.label} #${id}`} onClose={onClose} width="max-w-2xl">
      {!values ? (
        error ? <ErrorBox message={error} /> : <Skeleton className="h-64 w-full" />
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {row?._label && <p className="-mt-3 truncate text-sm text-ink-400">{row._label}</p>}
          <ErrorBox message={error} />
          <div className="grid gap-4 sm:grid-cols-2">
            {table.fields.map((f) => (
              <FieldInput
                key={f.name}
                field={f}
                value={values[f.name]}
                error={errors[f.name]}
                disabled={!editable(f)}
                isNew={isNew}
                onChange={(v) => set(f.name, v)}
              />
            ))}
          </div>

          {related.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              <div className="eyebrow mb-2">Related records</div>
              <div className="flex flex-wrap gap-2">
                {related.map(({ t, f }) => (
                  <Link
                    key={`${t.key}.${f.name}`}
                    to={`/admin/data/${t.key}?${f.name}=${id}`}
                    onClick={onClose}
                    className="chip hover:border-signal-400/40 hover:text-signal-300"
                  >
                    {t.label}
                    <IconArrow size={12} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-4">
            <div>
              {!isNew && (
                <button type="button" className="btn-danger" onClick={() => onDelete(row)}>
                  <IconTrash size={15} />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {saved && <span className="text-sm text-signal-300">Saved</span>}
              <button type="button" className="btn-ghost" onClick={onClose}>
                Close
              </button>
              <button className="btn" disabled={busy}>
                {busy ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

function FieldInput({ field: f, value, error, disabled, isNew, onChange }) {
  const wide = f.type === 'TEXT' || f.type === 'REF' || f.type === 'PASSWORD';
  const req = f.required && !disabled && (f.type !== 'PASSWORD' || isNew);
  const hint = f.type === 'PASSWORD' && isNew ? 'At least 8 characters.' : f.hint;
  const cls = `input ${error ? 'border-rose-400/60' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`;
  const numeric = f.type === 'INT' || f.type === 'DECIMAL';

  let input;
  switch (f.type) {
    case 'TEXT':
      input = <textarea className={`${cls} min-h-[6rem] resize-y`} maxLength={f.maxLength} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'BOOLEAN':
      input = (
        <label className={`flex h-[2.625rem] items-center gap-2.5 text-sm ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
          <input type="checkbox" className="h-4 w-4 accent-[#c3f53c]" disabled={disabled} checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          {value ? 'Yes' : 'No'}
        </label>
      );
      break;
    case 'ENUM':
      input = (
        <select className={cls} disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {!f.required && <option value="">—</option>}
          {f.options.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
        </select>
      );
      break;
    case 'REF':
      input = <RefPicker refKey={f.ref} value={value} disabled={disabled} invalid={!!error} onChange={onChange} />;
      break;
    case 'PASSWORD':
      input = <input className={`${cls} font-mono`} type="text" autoComplete="new-password" disabled={disabled} value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={isNew ? '' : '••••••••'} />;
      break;
    default:
      input = (
        <input
          className={`${cls} ${numeric ? 'tnum' : ''}`}
          type={{ INT: 'number', DECIMAL: 'number', DATE: 'date', DATETIME: 'datetime-local' }[f.type] || 'text'}
          step={f.type === 'DECIMAL' ? 'any' : f.type === 'INT' ? 1 : undefined}
          min={numeric ? f.min : undefined}
          max={numeric ? f.max : undefined}
          maxLength={f.maxLength}
          disabled={disabled}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <label className="label">
        {f.label}
        {req && <span className="ml-0.5 text-signal-400">*</span>}
        {f.readOnly && <span className="ml-1.5 normal-case tracking-normal text-ink-500">(calculated)</span>}
        {f.createOnly && !isNew && <span className="ml-1.5 normal-case tracking-normal text-ink-500">(fixed after creation)</span>}
      </label>
      {input}
      {error ? <p className="mt-1 text-xs text-rose-300">{error}</p> : hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/** Searchable picker for a referenced row. Shows the current choice; typing searches the target table. */
function RefPicker({ refKey, value, disabled, invalid, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [options, setOptions] = useState([]);
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      api.get(`/admin/data/${refKey}/options`, { params: { q: q || undefined } }).then((r) => setOptions(r.data)).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [open, q, refKey]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={box} className="relative">
      <input
        className={`input ${invalid ? 'border-rose-400/60' : ''} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        disabled={disabled}
        placeholder="Search by name or id…"
        value={open ? q : value ? `${value.label}  (#${value.id})` : ''}
        onFocus={() => {
          setQ('');
          setOpen(true);
        }}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setOpen(false);
          }
          if (e.key === 'Enter') {
            e.preventDefault();
            if (options[0]) {
              onChange(options[0]);
              setOpen(false);
            }
          }
        }}
      />
      {open && (
        <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl border border-white/[0.1] bg-ink-800 p-1 shadow-lift">
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-500">No matches</li>
          ) : (
            options.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/[0.06] ${
                    value?.id === o.id ? 'text-signal-300' : 'text-ink-100'
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  <span className="tnum font-mono text-xs text-ink-500">#{o.id}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
