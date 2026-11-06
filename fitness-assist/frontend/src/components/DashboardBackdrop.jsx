import { useEffect, useRef, useState } from 'react';
import { gsap, reducedMotion } from '../lib/motion.js';

// Drop a looping clip at public/dashboard-bg.mp4 to use video; until then (or if
// it fails to load) the photo is shown on its own.
const IMAGE = '/auth-bg.jpg';
const VIDEO = '/dashboard-bg.mp4';

/**
 * Full-page backdrop behind the dashboard: a dimmed gym photo (or video) with a
 * slow drift, under a heavy veil so the cards stay readable.
 */
export default function DashboardBackdrop() {
  const root = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const still = reducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || still) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-dash-media]',
        { opacity: 0, scale: 1.12 },
        { opacity: 1, scale: 1.04, duration: 1.6, ease: 'power2.out' }
      );
      // Slow Ken Burns drift so the photo is never completely static.
      gsap.to('[data-dash-image]', {
        xPercent: -2,
        yPercent: -1.5,
        scale: 1.08,
        duration: 24,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, el);
    return () => ctx.revert();
  }, [still]);

  return (
    <div ref={root} aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div data-dash-media className="absolute inset-0">
        <div
          data-dash-image
          className="absolute -inset-[4%] bg-cover bg-center"
          style={{ backgroundImage: `url(${IMAGE})`, filter: 'blur(6px) brightness(0.45) saturate(0.9)' }}
        />
        {!still && !videoFailed && (
          <video
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ filter: 'brightness(0.4) saturate(0.9)' }}
            src={VIDEO}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        )}
      </div>
      {/* Veil: darker at the bottom and left where most of the content sits. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(17,15,13,0.55)_0%,rgba(17,15,13,0.82)_45%,rgba(17,15,13,0.96)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(60rem_30rem_at_15%_0%,rgba(244,130,79,0.12),transparent_70%)]" />
      <div className="absolute inset-0 bg-grain opacity-[0.05] mix-blend-overlay" />
    </div>
  );
}
