import { useEffect, useRef } from 'react';
import { gsap, useCountUp, useMeter, useTilt, reducedMotion, EASE } from '../lib/motion.js';
import { IconAlert } from './icons.jsx';

export const label = (s) => s.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/* ------------------------------------------------------------------ layout */

/**
 * A panel. `tilt` adds the cursor-tracking lean plus a soft highlight that
 * follows the pointer — only worth it on cards the user actually interacts with.
 */
export function Card({ as: Tag = 'div', tilt = false, reveal = '', className = '', children, ...rest }) {
  const tiltRef = useTilt();
  return (
    <Tag
      ref={tilt ? tiltRef : undefined}
      data-reveal={reveal === false ? undefined : reveal}
      className={`card ${tilt ? 'card-hover group/card' : ''} ${className}`}
      {...rest}
    >
      {tilt && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background:
              'radial-gradient(22rem 22rem at var(--mx, 50%) var(--my, 0%), rgba(195,245,60,0.07), transparent 70%)',
          }}
        />
      )}
      <div className="relative">{children}</div>
    </Tag>
  );
}

/** Page title block. The rule under it draws itself in on mount. */
export function PageHeader({ title, subtitle, children }) {
  const rule = useRef(null);

  useEffect(() => {
    if (!rule.current || reducedMotion()) return;
    const tween = gsap.fromTo(
      rule.current,
      { scaleX: 0 },
      { scaleX: 1, duration: 1.1, ease: EASE, transformOrigin: 'left center', delay: 0.15 }
    );
    return () => tween.kill();
  }, []);

  return (
    <header className="pb-1">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-display font-bold">{title}</h1>
          {subtitle && <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-400">{subtitle}</p>}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
      <div
        ref={rule}
        className="mt-5 h-px w-full bg-gradient-to-r from-signal-400/50 via-white/[0.08] to-transparent"
      />
    </header>
  );
}

/** Card with a heading row and an optional action on the right. */
export function Panel({ title, action, note, className = '', reveal = '', bodyClass = '', children }) {
  return (
    <Card reveal={reveal} className={className}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {note && <p className="mt-0.5 text-xs text-ink-400">{note}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={bodyClass}>{children}</div>
    </Card>
  );
}

/* -------------------------------------------------------------------- data */

/** Big animated figure with a unit and optional caption. */
export function Readout({ value, unit, caption, decimals = 0, tone = 'default', className = '' }) {
  const ref = useCountUp(value, { decimals });
  const tones = {
    default: 'text-ink-50',
    signal: 'text-signal-300',
    warn: 'text-amber-300',
    over: 'text-rose-300',
  };
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <span ref={ref} className={`readout tnum ${tones[tone]}`}>
          0
        </span>
        {unit && <span className="unit">{unit}</span>}
      </div>
      {caption && <p className="mt-1.5 text-sm text-ink-400">{caption}</p>}
    </div>
  );
}

/** Compact labelled figure for a row of KPIs. */
export function Stat({ title, value, unit, decimals = 0, hint }) {
  const ref = useCountUp(value, { decimals });
  return (
    <div className="min-w-0">
      <div className="eyebrow">{title}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span ref={ref} className="tnum font-mono text-2xl font-bold text-ink-50">
          0
        </span>
        {unit && <span className="text-xs text-ink-400">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 truncate text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

/** Horizontal meter. Grows on mount and when the value changes. */
export function ProgressBar({ value, max, over, className = '' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const ref = useMeter(pct);
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-white/[0.07] ${className}`}>
      <div
        ref={ref}
        style={{ width: 0 }}
        className={`h-full rounded-full ${
          over
            ? 'bg-gradient-to-r from-rose-500 to-rose-400'
            : 'bg-gradient-to-r from-signal-500 to-signal-300'
        }`}
      />
    </div>
  );
}

/** Labelled meter: name, value/target, bar. Used for macros. */
export function MacroMeter({ name, value, max, unit = 'g', left }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-ink-200">{name}</span>
        <span className="tnum text-xs text-ink-400">
          {Math.round(value)} / {Math.round(max)} {unit}
        </span>
      </div>
      <ProgressBar value={value} max={max} />
      {left != null && <div className="mt-1 text-xs text-ink-500">{Math.round(left)} {unit} left</div>}
    </div>
  );
}

/** Circular meter. The arc draws itself from zero. */
export function Ring({ value, max, size = 132, stroke = 9, children }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const arc = useRef(null);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  useEffect(() => {
    const el = arc.current;
    if (!el) return;
    const target = c * (1 - pct);
    if (reducedMotion()) {
      el.style.strokeDashoffset = target;
      return;
    }
    const tween = gsap.fromTo(
      el,
      { strokeDashoffset: c },
      { strokeDashoffset: target, duration: 1.4, ease: EASE }
    );
    return () => tween.kill();
  }, [pct, c]);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a8e01f" />
            <stop offset="100%" stopColor="#d6fb6e" />
          </linearGradient>
        </defs>
        <circle
          ref={arc}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------- forms */

export function Field({ label: text, hint, className = '', children }) {
  return (
    <div className={className}>
      <label className="label">{text}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------- feedback */

/** Error banner. Slides down rather than appearing and shoving the page. */
export function ErrorBox({ message }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!message || !ref.current || reducedMotion()) return;
    const tween = gsap.from(ref.current, {
      opacity: 0,
      y: -8,
      height: 0,
      marginBottom: 0,
      duration: 0.4,
      ease: EASE,
      clearProps: 'all',
    });
    return () => tween.kill();
  }, [message]);

  if (!message) return null;
  return (
    <div
      ref={ref}
      role="alert"
      className="flex items-start gap-2.5 overflow-hidden rounded-xl border border-rose-500/25 bg-rose-500/[0.08] px-3.5 py-3 text-sm text-rose-200"
    >
      <IconAlert size={17} className="mt-px text-rose-400" />
      <span>{message}</span>
    </div>
  );
}

export function Chip({ tone = 'default', children, className = '' }) {
  const tones = { default: '', signal: 'chip-signal', warn: 'chip-warn' };
  return <span className={`chip ${tones[tone]} ${className}`}>{children}</span>;
}

/** Empty state. Deliberately plain — a dashed box, one line, optional action. */
export function Empty({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.03] text-ink-400">
          <Icon size={19} />
        </span>
      )}
      <p className="text-sm font-medium text-ink-200">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-ink-500">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Shimmering placeholder used while a panel's data is in flight. */
export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-white/[0.05] ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/[0.07] to-transparent" />
    </div>
  );
}

/**
 * Wraps a table so it scrolls sideways on small screens with a faded edge
 * instead of being clipped or forcing the page wide.
 */
export function TableWrap({ children }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
      <div className="min-w-[34rem]">{children}</div>
    </div>
  );
}
