/**
 * Inline 24px stroke icons. One shared wrapper keeps stroke weight and joins
 * consistent; `currentColor` means they inherit whatever text colour they sit in.
 */
function Svg({ children, size = 18, className = '', ...rest }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconGauge = (p) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 1 1 18 0" />
    <path d="M12 12l4.5-3.5" />
    <circle cx="12" cy="12" r="1.5" />
    <path d="M3 12h2m14 0h2M5.6 6.6l1.4 1.4" />
  </Svg>
);

export const IconDumbbell = (p) => (
  <Svg {...p}>
    <path d="M6.5 7.5v9M3.5 9.5v5M17.5 7.5v9M20.5 9.5v5M6.5 12h11" />
  </Svg>
);

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="M4 12.5 12 17l8-4.5" />
    <path d="M4 16.5 12 21l8-4.5" />
  </Svg>
);

export const IconPulse = (p) => (
  <Svg {...p}>
    <path d="M3 12h3.5l2-5 3 10 2.5-5H21" />
  </Svg>
);

export const IconFlame = (p) => (
  <Svg {...p}>
    <path d="M12 3s5 4 5 8.5a5 5 0 0 1-10 0C7 9 9 7.5 9 7.5s.5 2 1.5 2.5C11 8 12 6 12 3Z" />
  </Svg>
);

export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M4 20V4" />
    <path d="M4 20h16" />
    <path d="M8 20v-6M13 20V8M18 20v-9" />
  </Svg>
);

export const IconUser = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M14 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
    <path d="M10 8 6 12l4 4M6 12h8" />
  </Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Svg>
);

export const IconArrow = (p) => (
  <Svg {...p}>
    <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
  </Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconAlert = (p) => (
  <Svg {...p}>
    <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
    <path d="M12 10v4.5M12 17.5h.01" />
  </Svg>
);

export const IconMenu = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconScale = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M8 10a4 4 0 0 1 8 0" />
    <path d="M12 10l2-2" />
  </Svg>
);
