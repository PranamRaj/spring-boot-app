import { useEffect, useRef } from 'react';
import { gsap, reducedMotion, EASE, EASE_SOFT } from '../lib/motion.js';
import { IconDumbbell } from './icons.jsx';

/**
 * Two-column frame for log in / register. The left column is a quiet pitch that
 * collapses away under lg; the form is always the first thing on a phone.
 */
export default function AuthShell({ title, lead, aside, children }) {
  const root = useRef(null);

  useEffect(() => {
    if (!root.current || reducedMotion()) return;

    const ctx = gsap.context((self) => {
      const tl = gsap.timeline({ defaults: { ease: EASE } });
      tl.from('[data-auth-brand]', { opacity: 0, y: -12, duration: 0.5 })
        .from('[data-auth-pitch] > *', { opacity: 0, y: 18, duration: 0.6, stagger: 0.08 }, 0.1)
        .from('[data-auth-card]', { opacity: 0, y: 26, scale: 0.985, duration: 0.7 }, 0.12)
        .from(
          '[data-auth-card] [data-auth-field]',
          { opacity: 0, y: 12, duration: 0.45, stagger: 0.05, ease: EASE_SOFT },
          0.3
        );

      // Slow drift on the backdrop so the page is never completely static.
      const glow = self.selector('[data-auth-glow]');
      if (glow.length) {
        gsap.to(glow, {
          xPercent: 10,
          yPercent: -8,
          scale: 1.12,
          duration: 14,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
      }
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="relative min-h-screen overflow-hidden">
      <div
        data-auth-glow
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-signal-400/[0.07] blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[82rem] items-center gap-12 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_minmax(0,27rem)] lg:gap-16 lg:py-16">
        {/* Pitch — second in the DOM order on mobile so the form leads. */}
        <div data-auth-pitch className="order-2 hidden lg:order-1 lg:block">
          <div className="eyebrow">Fitness Assist</div>
          <h2 className="mt-4 max-w-lg text-display font-bold">{title}</h2>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ink-400">{lead}</p>
          {aside && <div className="mt-10 max-w-md">{aside}</div>}
        </div>

        <div className="order-1 w-full lg:order-2">
          <div data-auth-brand className="mb-6 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-signal-400 text-ink-950">
              <IconDumbbell size={17} />
            </span>
            <span className="text-[0.95rem] font-semibold tracking-tight">
              Fitness<span className="text-ink-400">Assist</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Three-up figures under the pitch copy. Static text, not fake stats. */
export function AuthPoints({ items }) {
  return (
    <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
      {items.map(([head, body]) => (
        <li key={head}>
          <div className="text-sm font-semibold text-signal-300">{head}</div>
          <div className="mt-1.5 text-xs leading-relaxed text-ink-500">{body}</div>
        </li>
      ))}
    </ul>
  );
}
