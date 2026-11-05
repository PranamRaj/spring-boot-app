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
  IconDumbbell,
  IconFlame,
  IconGauge,
  IconLayers,
  IconLogout,
  IconMenu,
  IconPulse,
  IconUser,
} from './icons.jsx';

const links = [
  ['/', 'Dashboard', IconGauge],
  ['/exercises', 'Exercises', IconDumbbell],
  ['/routines', 'Routines', IconLayers],
  ['/workouts', 'Workouts', IconPulse],
  ['/nutrition', 'Nutrition', IconFlame],
  ['/progress', 'Progress', IconChart],
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

function NavItem({ to, text, Icon, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
          isActive ? 'text-ink-950' : 'text-ink-300 hover:bg-white/[0.05] hover:text-ink-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            className={`transition-transform duration-300 ease-out ${
              isActive ? '' : 'group-hover:translate-x-0.5'
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
 * to a new row.
 */
function NavRail({ onNavigate, watch }) {
  const listRef = useRef(null);
  const pillRef = useRef(null);
  const { pathname } = useLocation();
  const first = useRef(true);

  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;

    const measure = () => {
      const active = list.querySelector('a[aria-current="page"]');
      // A hidden rail measures zero. Park the pill and wait for the next pass
      // rather than pinning it to a zero-height box.
      if (!active || !active.offsetHeight) {
        gsap.set(pill, { opacity: 0 });
        return;
      }

      const instant = first.current || reducedMotion();
      first.current = false;

      gsap.to(pill, {
        y: active.offsetTop,
        height: active.offsetHeight,
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
  }, [pathname, watch]);

  return (
    <nav ref={listRef} className="relative flex flex-col gap-0.5">
      <span
        ref={pillRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 rounded-xl bg-signal-400 opacity-0"
      />
      {links.map(([to, text, Icon]) => (
        <NavItem key={to} to={to} text={text} Icon={Icon} onClick={onNavigate} />
      ))}
    </nav>
  );
}

function UserBlock({ user, onLogout }) {
  return (
    <div className="space-y-1">
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
    <div className="min-h-screen">
      {/* Reading position, pinned above everything. */}
      <div
        ref={progressRef}
        className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-signal-400"
        style={{ transform: 'scaleX(0)' }}
        aria-hidden="true"
      />

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--rail)] flex-col justify-between border-r border-white/[0.07] bg-ink-900/40 px-4 py-6 backdrop-blur-xl lg:flex">
        <div className="space-y-8">
          <Wordmark className="px-1" />
          <NavRail />
        </div>
        <UserBlock user={user} onLogout={logout} />
      </aside>

      {/* Mobile top bar. Gains a border and blur once the page scrolls. */}
      <header
        ref={topBarRef}
        className="sticky top-0 z-30 border-b border-transparent px-4 py-3 transition-colors duration-300 [&.is-stuck]:border-white/[0.07] [&.is-stuck]:bg-ink-950/80 [&.is-stuck]:backdrop-blur-xl lg:hidden"
      >
        <div className="flex items-center justify-between gap-3">
          <Wordmark />
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
            aria-expanded={menuOpen}
            className="btn-ghost px-2.5 py-2"
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
      <main className="overflow-x-clip lg:pl-[var(--rail)]">
        <div
          ref={mainRef}
          className="mx-auto w-full max-w-[78rem] px-4 pb-24 pt-4 sm:px-6 lg:px-10 lg:pt-12"
        >
          {children}
        </div>
      </main>
    </div>
  );
}
