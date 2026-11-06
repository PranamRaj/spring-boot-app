import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import {
  gsap,
  reducedMotion,
  usePageIntro,
  useScrollProgress,
  useScrolledPast,
  EASE,
  EASE_SOFT,
} from '../lib/motion.js';
import {
  IconChart,
  IconClose,
  IconDatabase,
  IconDumbbell,
  IconFlame,
  IconGauge,
  IconLayers,
  IconLogout,
  IconMenu,
  IconPulse,
  IconShield,
  IconUser,
  IconUsers,
} from './icons.jsx';

const links = [
  ['/', 'Dashboard', IconGauge],
  ['/exercises', 'Exercises', IconDumbbell],
  ['/routines', 'Routines', IconLayers],
  ['/workouts', 'Workouts', IconPulse],
  ['/nutrition', 'Nutrition', IconFlame],
  ['/progress', 'Progress', IconChart],
];

const adminLinks = [
  ['/admin', 'Overview', IconGauge],
  ['/admin/trainees', 'Trainees', IconUsers],
  ['/admin/data', 'Database', IconDatabase],
  ['/exercises', 'Exercises', IconDumbbell],
];

function Wordmark({ className = '' }) {
  return (
    <NavLink to="/" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-signal-400 text-ink-950 transition-transform duration-500 ease-out group-hover:rotate-[-8deg]">
        <IconDumbbell size={17} />
      </span>
      <span className="text-[0.95rem] font-semibold leading-none tracking-tight text-ink-50">
        Fitness<span className="text-ink-400">Assist</span>
      </span>
    </NavLink>
  );
}

function NavItem({ to, text, Icon, onClick, horizontal }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/admin'}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl text-sm font-medium transition-colors duration-200 ${
          horizontal ? 'gap-2 px-3 py-2' : 'gap-3 px-3 py-2.5'
        } ${isActive ? 'text-ink-950' : 'text-ink-300 hover:bg-white/[0.06] hover:text-ink-50'}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={horizontal ? 15 : 17}
            className={`relative z-10 transition-transform duration-300 ease-out ${
              isActive ? '' : horizontal ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-x-0.5'
            }`}
          />
          <span className="relative z-10">{text}</span>
        </>
      )}
    </NavLink>
  );
}

/**
 * The lime pill behind the active nav item. It lives outside the links and is
 * moved with GSAP, so changing page slides the highlight instead of blinking it
 * to a new item. Works as a row (top bar) or a column (mobile drawer).
 */
function NavRail({ onNavigate, watch, horizontal = false }) {
  const listRef = useRef(null);
  const pillRef = useRef(null);
  const { pathname } = useLocation();
  const { isAdmin } = useAuth();
  const items = isAdmin ? adminLinks : links;
  const first = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;

    const measure = () => {
      const active = list.querySelector('a[aria-current="page"]');
      // A hidden rail measures zero. Park the pill and wait for the next pass.
      if (!active || !active.offsetHeight) {
        gsap.set(pill, { opacity: 0 });
        return;
      }

      const instant = first.current || reducedMotion();
      first.current = false;

      gsap.to(pill, {
        ...(horizontal
          ? { x: active.offsetLeft, width: active.offsetWidth, height: active.offsetHeight }
          : { y: active.offsetTop, height: active.offsetHeight }),
        opacity: 1,
        duration: instant ? 0 : 0.45,
        ease: EASE,
        overwrite: true,
      });
    };

    measure();
    // The mobile drawer is still display:none on the commit that opens it, so
    // measure again once the browser has laid it out.
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [pathname, watch, horizontal]);

  return (
    <nav ref={listRef} className={`relative flex ${horizontal ? 'items-center gap-1' : 'flex-col gap-0.5'}`}>
      <span
        ref={pillRef}
        aria-hidden="true"
        className={`pointer-events-none absolute top-0 rounded-xl bg-signal-400 opacity-0 ${
          horizontal ? 'left-0 shadow-glow' : 'inset-x-0'
        }`}
      />
      {items.map(([to, text, Icon]) => (
        <span key={to} data-nav-item>
          <NavItem to={to} text={text} Icon={Icon} onClick={onNavigate} horizontal={horizontal} />
        </span>
      ))}
    </nav>
  );
}

/** Profile + log out block for the mobile drawer. */
function UserBlock({ user, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';
  return (
    <div className="space-y-1">
      {isAdmin ? (
        // Admins have no fitness profile to edit, so this is a label rather than a link.
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-300">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-signal-400/30 bg-signal-400/10 text-signal-300">
            <IconShield size={14} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-ink-100">{user?.name || 'Admin'}</span>
            <span className="block text-[0.6875rem] uppercase tracking-[0.12em] text-ink-500">Admin</span>
          </span>
        </div>
      ) : (
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200 ${
              isActive ? 'bg-white/[0.07] text-ink-50' : 'text-ink-300 hover:bg-white/[0.05] hover:text-ink-50'
            }`
          }
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.04] text-[0.6875rem] font-semibold uppercase text-signal-300">
            {user?.name?.trim()?.charAt(0) || <IconUser size={14} />}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium">{user?.name || 'Profile'}</span>
        </NavLink>
      )}
      <button
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-400 transition-colors duration-200 hover:bg-white/[0.05] hover:text-ink-100"
      >
        <IconLogout size={17} />
        Log out
      </button>
    </div>
  );
}

/** Avatar + name + log out, sized for the top bar. */
function TopUser({ user, onLogout }) {
  const isAdmin = user?.role === 'ADMIN';
  const avatar = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-signal-400/30 bg-signal-400/10 text-xs font-semibold uppercase text-signal-300">
      {isAdmin ? <IconShield size={14} /> : user?.name?.trim()?.charAt(0) || <IconUser size={14} />}
    </span>
  );
  const label = (
    <span className="hidden min-w-0 text-left xl:block">
      <span className="block max-w-[9rem] truncate text-sm font-medium leading-tight text-ink-100">
        {user?.name || (isAdmin ? 'Admin' : 'Profile')}
      </span>
      <span className="block text-[0.625rem] uppercase tracking-[0.14em] text-ink-500">
        {isAdmin ? 'Admin' : 'Trainee'}
      </span>
    </span>
  );

  return (
    <div className="flex items-center gap-1.5">
      {isAdmin ? (
        <div className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3">
          {avatar}
          {label}
        </div>
      ) : (
        <NavLink
          to="/profile"
          title="Profile"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-full p-1 transition-colors duration-200 xl:pr-3 ${
              isActive ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'
            }`
          }
        >
          {avatar}
          {label}
        </NavLink>
      )}
      <button
        onClick={onLogout}
        aria-label="Log out"
        title="Log out"
        className="flex h-9 w-9 items-center justify-center rounded-full text-ink-400 transition-colors duration-200 hover:bg-white/[0.06] hover:text-ink-100"
      >
        <IconLogout size={17} />
      </button>
    </div>
  );
}

// The bar drops in on first load only; Layout remounts on every route change.
let navIntroPlayed = false;

export default function Layout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const progressRef = useScrollProgress();
  const topBarRef = useScrolledPast(10, 'is-stuck');
  const mainRef = usePageIntro(pathname);

  const drawerRef = useRef(null);
  const scrimRef = useRef(null);
  const sheetRef = useRef(null);

  const logout = () => {
    signOut();
    navigate('/login');
  };

  // Top bar entrance: bar slides down, then brand, links and user stagger in.
  useLayoutEffect(() => {
    const el = topBarRef.current;
    if (!el || navIntroPlayed || reducedMotion()) return;
    navIntroPlayed = true;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: EASE } })
        .from(el, { yPercent: -100, opacity: 0, duration: 0.6, clearProps: 'transform,opacity' })
        .from('[data-nav-brand]', { opacity: 0, x: -12, duration: 0.45 }, 0.2)
        .from('[data-nav-item]', { opacity: 0, y: -10, duration: 0.4, stagger: 0.05 }, 0.25)
        .from('[data-nav-user]', { opacity: 0, x: 12, duration: 0.45 }, 0.35);
    }, el);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close the drawer whenever the route changes.
  useEffect(() => setMenuOpen(false), [pathname]);

  // Drawer open/close: scrim fades, sheet slides, links stagger in.
  useEffect(() => {
    const root = drawerRef.current;
    if (!root) return;

    if (menuOpen) {
      root.hidden = false;
      if (reducedMotion()) return;
      const tl = gsap.timeline();
      tl.fromTo(scrimRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'none' })
        .fromTo(sheetRef.current, { xPercent: -100 }, { xPercent: 0, duration: 0.45, ease: EASE }, 0)
        .fromTo(
          sheetRef.current.querySelectorAll('[data-stagger]'),
          { opacity: 0, x: -14 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.04, ease: EASE_SOFT, clearProps: 'all' },
          0.12
        );
      return () => tl.kill();
    }

    if (reducedMotion()) {
      root.hidden = true;
      return;
    }
    const tl = gsap.timeline({ onComplete: () => (root.hidden = true) });
    tl.to(sheetRef.current, { xPercent: -100, duration: 0.3, ease: 'power2.in' }).to(
      scrimRef.current,
      { opacity: 0, duration: 0.25 },
      0
    );
    return () => tl.kill();
  }, [menuOpen]);

  // Lock the page behind the drawer, and let Escape close it.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="relative min-h-screen">
      {/* Reading position, pinned above everything. */}
      <div
        ref={progressRef}
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-signal-400"
        style={{ transform: 'scaleX(0)' }}
        aria-hidden="true"
      />

      {/* Top bar. Always glass; fills in and gains a border once the page scrolls. */}
      <header
        ref={topBarRef}
        className="sticky top-0 z-30 border-b border-white/[0.05] bg-ink-950/45 backdrop-blur-xl transition-colors duration-300 [&.is-stuck]:border-white/[0.09] [&.is-stuck]:bg-ink-950/85"
      >
        <div className="mx-auto flex h-16 w-full max-w-[78rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div data-nav-brand>
            <Wordmark />
          </div>

          <div className="hidden lg:block">
            <NavRail horizontal />
          </div>

          <div data-nav-user className="hidden lg:block">
            <TopUser user={user} onLogout={logout} />
          </div>

          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            className="btn-ghost px-2.5 py-2 lg:hidden"
          >
            <IconMenu size={19} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div ref={drawerRef} hidden className="fixed inset-0 z-40 lg:hidden">
        <div
          ref={scrimRef}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
        />
        <div
          ref={sheetRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="absolute inset-y-0 left-0 flex w-[min(19rem,86vw)] flex-col justify-between border-r border-white/[0.08] bg-ink-900 px-4 py-5 shadow-2xl"
        >
          <div className="space-y-7">
            <div data-stagger className="flex items-center justify-between">
              <Wordmark />
              <button onClick={() => setMenuOpen(false)} aria-label="Close navigation" className="btn-ghost px-2.5 py-2">
                <IconClose size={18} />
              </button>
            </div>
            <div data-stagger>
              <NavRail watch={menuOpen} onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
          <div data-stagger>
            <UserBlock user={user} onLogout={logout} />
          </div>
        </div>
      </div>

      {/* `clip` rather than `hidden`: it contains stray transforms during an
          entrance without turning this into a scroll container, which would
          break the sticky panels inside. */}
      <main className="overflow-x-clip">
        <div
          ref={mainRef}
          className="mx-auto w-full max-w-[78rem] px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pt-10"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
