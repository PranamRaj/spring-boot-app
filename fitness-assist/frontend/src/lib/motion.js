import { useEffect, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// One easing curve for entrances, one for scrubbed motion. Using the same two
// everywhere is most of what makes a set of animations feel deliberate.
export const EASE = 'power3.out';
export const EASE_SOFT = 'power2.out';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** ScrollTrigger caches element positions; call after content height changes. */
export const refreshMotion = () => ScrollTrigger.refresh();

/**
 * Reveals every `[data-reveal]` descendant as it scrolls into view. Elements
 * entering together are batched so they stagger as a group instead of each one
 * firing its own identical tween.
 *
 * `data-reveal` picks the direction: "" (up), "left", "right", "scale", "fade".
 * Pass `deps` so newly rendered nodes get picked up after data loads; nodes that
 * already played are skipped, so a refetch never re-hides the page.
 */
export function useReveal(deps = []) {
  const scope = useRef(null);

  useEffect(() => {
    const root = scope.current;
    if (!root) return;

    if (reducedMotion()) {
      root.classList.add('is-ready');
      return;
    }

    const els = gsap.utils
      .toArray('[data-reveal]', root)
      .filter((el) => !el.dataset.revealDone);

    if (!els.length) return;

    const from = {
      '': { y: 28 },
      left: { x: -32 },
      right: { x: 32 },
      scale: { scale: 0.94, y: 14 },
      fade: {},
    };

    // A horizontal offset parks the element outside the page until it reveals,
    // which shows up as a stray horizontal scrollbar on narrow screens. Those
    // reveals also only make sense beside a neighbouring column, and the layout
    // is single-column below lg, so fall back to the vertical reveal there.
    const sideways = window.matchMedia('(min-width: 1024px)').matches;

    els.forEach((el) => {
      const kind = el.dataset.reveal;
      const dir = !sideways && (kind === 'left' || kind === 'right') ? '' : kind;
      gsap.set(el, { opacity: 0, ...(from[dir] ?? from['']) });
    });

    const triggers = ScrollTrigger.batch(els, {
      start: 'top 90%',
      once: true,
      batchMax: 6,
      interval: 0.1,
      onEnter: (batch) => {
        batch.forEach((el) => {
          el.dataset.revealDone = '1';
        });
        gsap.to(batch, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.85,
          ease: EASE,
          stagger: 0.075,
          overwrite: true,
          clearProps: 'transform',
        });
      },
    });

    // Images and charts settle after first paint and shift everything below them.
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(id);
      triggers.forEach((t) => t.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/** Short intro timeline for the page shell, replayed on every route change. */
export function usePageIntro(key) {
  const scope = useRef(null);

  useLayoutEffect(() => {
    const root = scope.current;
    if (!root || reducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.from(root, { opacity: 0, y: 16, duration: 0.5, ease: EASE_SOFT, clearProps: 'all' });
    }, root);

    return () => ctx.revert();
  }, [key]);

  return scope;
}

/**
 * Counts a number up to `value` on mount and tweens between values after that,
 * so a figure that changes never just snaps.
 */
export function useCountUp(value, { decimals = 0, duration = 1.1, format } = {}) {
  const ref = useRef(null);
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (el == null) return;

    const target = Number(value) || 0;
    const render = (n) => {
      el.textContent = format ? format(n) : n.toFixed(decimals);
    };

    if (reducedMotion()) {
      current.current = target;
      render(target);
      return;
    }

    const proxy = { n: current.current };
    const tween = gsap.to(proxy, {
      n: target,
      duration,
      ease: EASE,
      onUpdate: () => render(proxy.n),
      onComplete: () => {
        current.current = target;
      },
    });

    return () => tween.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, duration]);

  return ref;
}

/** Grows a meter to `pct` (0-100), and regrows it when the value changes. */
export function useMeter(pct) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const width = `${Math.max(0, Math.min(100, pct || 0))}%`;

    if (reducedMotion()) {
      el.style.width = width;
      return;
    }

    const tween = gsap.to(el, { width, duration: 1, ease: EASE, delay: 0.1 });
    return () => tween.kill();
  }, [pct]);

  return ref;
}

/**
 * Tilts a card a few degrees toward the cursor and moves a light source with it
 * (via the --mx/--my custom properties). Pointer-fine devices only.
 */
export function useTilt({ max = 5 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !canHover()) return;

    // A perspective transform inflates the element's bounding box by a few
    // pixels, which is enough to produce a horizontal scrollbar on a narrow
    // window. Tilt is a wide-screen affordance anyway, so gate it on width and
    // only apply the transform while the pointer is actually over the card.
    const wide = window.matchMedia('(min-width: 1024px)');
    if (!wide.matches) return;

    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: EASE_SOFT });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: EASE_SOFT });

    const enter = () => gsap.set(el, { transformPerspective: 900, transformStyle: 'preserve-3d' });

    const move = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * max * 2);
      rx((0.5 - py) * max * 2);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    };

    const leave = () => {
      // Settle back to flat, then drop the transform so the box is exact again.
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        duration: 0.5,
        ease: EASE_SOFT,
        overwrite: true,
        onComplete: () => gsap.set(el, { clearProps: 'transform,transformStyle,perspective' }),
      });
    };

    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(el);
      gsap.set(el, { clearProps: 'transform,transformStyle,perspective' });
    };
  }, [max]);

  return ref;
}

/** Drifts an element against the scroll direction. Small values only. */
export function useParallax(distance = -40) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.to(el, {
        y: distance,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    });

    return () => ctx.revert();
  }, [distance]);

  return ref;
}

/**
 * Scales a bar from 0 to 1 across the document's scroll range. This reports
 * position rather than decorating, so it runs even when motion is reduced.
 */
export function useScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => gsap.set(el, { scaleX: self.progress }),
    });

    return () => trigger.kill();
  }, []);

  return ref;
}

/** Adds `className` to an element once the page has scrolled past `offset`. */
export function useScrolledPast(offset = 12, className = 'is-stuck') {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      start: offset,
      end: 'max',
      onToggle: (self) => el.classList.toggle(className, self.isActive),
    });

    return () => trigger.kill();
  }, [offset, className]);

  return ref;
}

export { gsap, ScrollTrigger };
