import { useEffect, useRef } from 'react';
import { gsap, reducedMotion, EASE, EASE_SOFT } from '../lib/motion.js';
import { IconDumbbell } from './icons.jsx';

const BG = '/auth-bg.jpg';

/**
 * Two-column frame for log in / register, set over a blurred gym photo. The left
 * column is a quiet pitch that collapses away under lg; the form is always the
 * first thing on a phone.
 */
export default function AuthShell({ title, lead, aside, children }) {
  const root = useRef(null);

  useEffect(() => {
    if (!root.current) return;
    const el = root.current;

    if (reducedMotion()) {
      gsap.set(el.querySelectorAll('[data-auth-bg]'), { opacity: 1 });
      return;
    }

    const ctx = gsap.context((self) => {
      const tl = gsap.timeline({ defaults: { ease: EASE } });

      // Photo comes in from sharper + brighter to its resting blur, so the page
      // "focuses" on the form rather than just appearing.
      tl.fromTo(
        '[data-auth-bg]',
        { opacity: 0, scale: 1.18, filter: 'blur(4px) brightness(0.9)' },
        { opacity: 1, scale: 1.08, filter: 'blur(14px) brightness(0.55)', duration: 1.8, ease: 'power2.out' },
        0
      )
        .from('[data-auth-veil]', { opacity: 0, duration: 1.2 }, 0)
        .from('[data-auth-brand]', { opacity: 0, y: -12, duration: 0.5 }, 0.3)
        .from('[data-auth-eyebrow]', { opacity: 0, x: -16, duration: 0.6 }, 0.35)
        .from(
          '[data-auth-word]',
          { yPercent: 110, rotate: 4, duration: 0.9, stagger: 0.045, ease: 'expo.out' },
          0.4
        )
        .from('[data-auth-rule]', { scaleX: 0, transformOrigin: 'left center', duration: 0.9 }, 0.7)
        .from('[data-auth-lead]', { opacity: 0, y: 14, duration: 0.6 }, 0.8)
        .from('[data-auth-aside] li', { opacity: 0, y: 18, duration: 0.6, stagger: 0.09 }, 0.9)
        .from('[data-auth-card]', { opacity: 0, y: 36, scale: 0.97, duration: 0.9 }, 0.35)
        .from(
          '[data-auth-card] [data-auth-field]',
          { opacity: 0, y: 14, duration: 0.5, stagger: 0.06, ease: EASE_SOFT },
          0.6
        );

      // Slow Ken Burns drift so the backdrop is never completely static.
      gsap.to('[data-auth-bg]', {
        xPercent: -2.5,
        yPercent: -2,
        scale: 1.12,
        duration: 22,
        delay: 1.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Ember glow follows the pointer, lagging behind it.
      const glow = self.selector('[data-auth-glow]')[0];
      if (glow && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        const gx = gsap.quickTo(glow, 'x', { duration: 1.4, ease: 'power3.out' });
        const gy = gsap.quickTo(glow, 'y', { duration: 1.4, ease: 'power3.out' });
        const move = (e) => {
          gx(e.clientX - window.innerWidth / 2);
          gy(e.clientY - window.innerHeight / 2);
        };
        window.addEventListener('pointermove', move);
        return () => window.removeEventListener('pointermove', move);
      }
    }, el);

    return () => ctx.revert();
  }, []);

  const words = String(title).split(' ');

  return (
    <div ref={root} className="relative isolate min-h-screen overflow-hidden bg-ink-950">
      {/* Backdrop: photo, blurred and dimmed, then a warm veil and grain on top. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          data-auth-bg
          className="absolute -inset-[6%] bg-cover bg-center opacity-0 will-change-transform"
          style={{
            backgroundImage: `url(${BG})`,
            filter: 'blur(14px) brightness(0.55)',
            transform: 'scale(1.08)',
          }}
        />
        <div
          data-auth-veil
          className="absolute inset-0 bg-[linear-gradient(105deg,rgba(17,15,13,0.92)_0%,rgba(17,15,13,0.7)_45%,rgba(17,15,13,0.55)_100%)]"
        />
        <div
          data-auth-glow
          className="absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal-500/[0.13] blur-[110px]"
        />
        <div className="absolute inset-0 bg-grain opacity-[0.06] mix-blend-overlay" />
      </div>

      <div className="relative mx-auto grid min-h-[100dvh] w-full max-w-[82rem] items-center gap-8 px-5 py-5 sm:px-8 lg:grid-cols-[1.05fr_minmax(0,25rem)] lg:gap-14 lg:py-6">
        {/* Pitch — second in the DOM order on mobile so the form leads. */}
        <div className="order-2 hidden lg:order-1 lg:block">
          <div data-auth-eyebrow className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-signal-400 text-ink-950">
              <IconDumbbell size={17} />
            </span>
            <span className="eyebrow text-ink-200">Fitness Assist</span>
          </div>

          <h2 className="mt-5 max-w-xl text-[clamp(2rem,1.2rem+2.4vw,3.25rem)] font-extrabold uppercase leading-[0.95] tracking-[-0.02em]">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top">
                <span data-auth-word className="inline-block">
                  {w}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              </span>
            ))}
          </h2>

          <div data-auth-rule className="mt-5 h-[3px] w-24 rounded-full bg-signal-400" />

          <p data-auth-lead className="mt-4 max-w-md text-[0.94rem] leading-relaxed text-ink-200/80">
            {lead}
          </p>
          {aside && (
            <div data-auth-aside className="mt-8 max-w-lg [@media(max-height:700px)]:hidden">
              {aside}
            </div>
          )}
        </div>

        <div className="order-1 w-full lg:order-2">
          <div data-auth-brand className="mb-4 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-signal-400 text-ink-950">
              <IconDumbbell size={17} />
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight">
              Fitness<span className="text-ink-400">Assist</span>
            </span>
          </div>
          <div data-auth-card className="auth-glass">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Three-up figures under the pitch copy. Static text, not fake stats. */
export function AuthPoints({ items }) {
  return (
    <ul className="grid gap-x-8 gap-y-4 border-t border-white/10 pt-5 sm:grid-cols-3">
      {items.map(([head, body], i) => (
        <li key={head}>
          <div className="font-mono text-[0.7rem] text-signal-300">0{i + 1}</div>
          <div className="mt-1.5 text-sm font-semibold text-ink-50">{head}</div>
          <div className="mt-1.5 text-xs leading-relaxed text-ink-300">{body}</div>
        </li>
      ))}
    </ul>
  );
}
