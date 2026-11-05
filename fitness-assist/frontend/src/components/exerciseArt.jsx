/**
 * Doodle illustrations for the exercise library.
 *
 * One drawing per exercise, all built from the same parts so the set reads as a
 * single hand: a 120x90 stage with the floor at y=82, a round-capped monoline
 * figure with no face, and equipment picked out in the accent colour. Nothing
 * here depicts a real person.
 *
 * Front view is used for symmetric standing lifts (it stays legible at thumbnail
 * size); side view for anything lying, hanging or seated.
 */

/* ------------------------------------------------------------ stage pieces */

const Floor = ({ y = 82 }) => <path className="stroke-ink-600" d={`M10 ${y}h100`} strokeWidth="2.5" />;

const Barbell = ({ x, y, hw = 30, a = 0 }) => (
  <g className="stroke-signal-400" transform={a ? `rotate(${a} ${x} ${y})` : undefined}>
    <path d={`M${x - hw} ${y}h${hw * 2}`} />
    <path d={`M${x - hw + 3} ${y - 7}v14M${x - hw + 8} ${y - 4.5}v9`} />
    <path d={`M${x + hw - 3} ${y - 7}v14M${x + hw - 8} ${y - 4.5}v9`} />
  </g>
);

const Dumbbell = ({ x, y, a = 0 }) => (
  <g className="stroke-signal-400" transform={a ? `rotate(${a} ${x} ${y})` : undefined}>
    <path d={`M${x - 7} ${y}h14`} />
    <path d={`M${x - 7} ${y - 5.5}v11M${x + 7} ${y - 5.5}v11`} />
  </g>
);

const Kettlebell = ({ x, y }) => (
  <g className="stroke-signal-400">
    <path d={`M${x - 4.5} ${y - 2.5}a4.5 5 0 0 1 9 0`} />
    <circle cx={x} cy={y + 4.5} r="6.5" />
  </g>
);

/** Flat pad on legs. `a` tilts it for incline work. */
const Bench = ({ x, y, w = 50, a = 0 }) => (
  <g className="stroke-signal-400" transform={a ? `rotate(${a} ${x + w / 2} ${y})` : undefined}>
    <path d={`M${x} ${y}h${w}`} />
    <path d={`M${x + 6} ${y}v${82 - y}M${x + w - 6} ${y}v${82 - y}`} />
  </g>
);

/**
 * Cable column: uprights, a pulley wheel at the working end and a block of
 * plates low down. The pulley is what stops it reading as a ladder.
 */
const Stack = ({ x, top = 14, w = 14, pulley = 'top' }) => {
  // Plates sit at whichever end the pulley is not, so the two never collide.
  const py = pulley === 'top' ? 50 : 22;
  return (
    <g className="stroke-signal-400">
      <path d={`M${x} ${top + 5}V82M${x + w} ${top + 5}V82`} />
      <circle cx={x + w / 2} cy={pulley === 'top' ? top + 4 : 73} r="4" />
      <rect x={x + 2.5} y={py} width={w - 5} height="30" rx="2" strokeWidth="2.6" />
      <path
        d={`M${x + 2.5} ${py + 8}h${w - 5}M${x + 2.5} ${py + 16}h${w - 5}M${x + 2.5} ${py + 24}h${w - 5}`}
        strokeWidth="2.2"
      />
    </g>
  );
};

const Cable = ({ d }) => <path className="stroke-signal-400" strokeWidth="2.2" d={d} />;

const Handle = ({ x, y, w = 11 }) => (
  <path className="stroke-signal-400" d={`M${x - w / 2} ${y}h${w}`} />
);

/* ----------------------------------------------------------- figure pieces */

const Head = ({ x, y, r = 7.5 }) => <circle cx={x} cy={y} r={r} />;

/* --------------------------------------------------------------- the scenes */

const scenes = {
  'Back Squat': (
    <>
      <Floor />
      <g>
        <Head x={60} y={20} />
        <path d="M60 27.5V44M50 48H70" />
        <path d="M52 48 38 56 42 81M68 48 82 56 78 81" />
        <path d="M48 34 40 40M72 34 80 40" />
      </g>
      <Barbell x={60} y={34} hw={26} />
    </>
  ),

  'Front Squat': (
    <>
      <Floor />
      <g>
        <Head x={60} y={20} />
        <path d="M60 27.5V44M50 48H70" />
        <path d="M52 48 38 56 42 81M68 48 82 56 78 81" />
        <path d="M48 34 44 30M72 34 76 30" />
      </g>
      <Barbell x={60} y={29} hw={26} />
    </>
  ),

  'Goblet Squat': (
    <>
      <Floor />
      <Head x={60} y={13} r={7} />
      <g>
        <path d="M49 28H71M60 28V34M50 58H70" />
        <path d="M52 58 38 66 42 81M68 58 82 66 78 81" />
        <path d="M49 30 54 42M71 30 66 42" />
      </g>
      <Kettlebell x={60} y={42} />
    </>
  ),

  Deadlift: (
    <>
      <Floor />
      <g>
        <Head x={44} y={30} />
        <path d="M51 32 70 42M64 46H76" />
        <path d="M68 46 66 62 70 81M74 46 78 62 74 81" />
        <path d="M54 37 52 62M62 40 60 62" />
      </g>
      <Barbell x={56} y={64} hw={26} />
    </>
  ),

  'Romanian Deadlift': (
    <>
      <Floor />
      <g>
        <Head x={42} y={26} />
        <path d="M49 29 70 36M64 40H76" />
        <path d="M68 40 70 60 68 81M74 40 76 60 74 81" />
        <path d="M53 33 52 52M61 36 60 52" />
      </g>
      <Barbell x={56} y={54} hw={26} />
    </>
  ),

  'Hip Thrust': (
    <>
      <Floor />
      <Bench x={14} y={50} w={28} />
      <g>
        <Head x={24} y={40} />
        <path d="M31 43 46 47M46 47H66M66 47 76 64 74 81" />
        <path d="M66 47 70 64 68 81" />
        <path d="M32 47 22 54" />
      </g>
      <Barbell x={64} y={41} hw={17} />
    </>
  ),

  'Glute Bridge': (
    <>
      <Floor />
      <g>
        <Head x={22} y={73} />
        <path d="M29 73 46 71M46 71 62 56M62 56 74 70 72 81" />
        <path d="M62 56 78 70 76 81" />
        <path d="M34 76 46 80" />
      </g>
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M50 44q12-4 20 6" />
    </>
  ),

  'Barbell Bench Press': (
    <>
      <Floor />
      <Bench x={20} y={58} w={50} />
      <g>
        <Head x={28} y={50} />
        <path d="M35 52H62M62 52 74 66 72 81" />
        <path d="M62 52 78 66 76 81" />
        <path d="M40 52V34M50 52V34" />
      </g>
      <Barbell x={45} y={32} hw={24} />
    </>
  ),

  'Incline Dumbbell Press': (
    <>
      <Floor />
      {/* Dumbbells sit side by side rather than stacked along the torso line —
          stacked, the two bells and two arms merge into one blob at this size. */}
      <g className="stroke-signal-400">
        <path d="M22 68 74 44" />
        <path d="M28 66v16M68 47v35" />
      </g>
      <g>
        <Head x={76} y={36} r={7} />
        <path d="M70 41 42 57" />
        <path d="M42 57 32 70 29 81" />
        <path d="M42 57 26 66 23 81" />
        <path d="M60 46 50 31M66 43 70 31" />
      </g>
      <Dumbbell x={48} y={28} />
      <Dumbbell x={72} y={28} />
    </>
  ),

  'Push-Up': (
    <>
      <Floor />
      <g>
        <Head x={28} y={52} />
        <path d="M35 54 60 58M60 58 84 68M84 68 88 81" />
        <path d="M40 56 40 70 34 78M66 60 66 72" />
      </g>
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M32 44 86 60" />
    </>
  ),

  'Cable Fly': (
    <>
      <Floor />
      <Stack x={6} top={16} />
      <Stack x={101} top={16} />
      <Cable d="M19 24 44 44M114 24 76 44" />
      <g>
        <Head x={60} y={22} />
        <path d="M60 29.5V48M51 52H69" />
        <path d="M52 52 48 66 48 81M68 52 72 66 72 81" />
        <path d="M50 34 44 44M70 34 76 44" />
      </g>
      <Handle x={44} y={44} w={9} />
      <Handle x={76} y={44} w={9} />
    </>
  ),

  'Pec Deck': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M46 58h28M52 58v14M68 58v14" />
        <path d="M38 38v14M82 38v14" />
      </g>
      <g>
        <Head x={60} y={24} />
        <path d="M60 31.5V54M51 34H69" />
        <path d="M51 36 40 40 40 50M69 36 80 40 80 50" />
        <path d="M54 58 52 72 52 81M66 58 68 72 68 81" />
      </g>
    </>
  ),

  'Overhead Press': (
    <>
      <Floor />
      <g>
        <Head x={60} y={30} />
        <path d="M60 37.5V54M51 58H69" />
        <path d="M52 58 50 70 50 81M68 58 70 70 70 81" />
        <path d="M50 42 44 26M70 42 76 26" />
      </g>
      <Barbell x={60} y={22} hw={28} />
    </>
  ),

  'Arnold Press': (
    <>
      <Floor />
      <g>
        <Head x={60} y={30} />
        <path d="M60 37.5V54M51 58H69" />
        <path d="M52 58 50 70 50 81M68 58 70 70 70 81" />
        <path d="M50 42 42 32 44 22M70 42 78 32 76 22" />
      </g>
      <Dumbbell x={44} y={18} />
      <Dumbbell x={76} y={18} />
    </>
  ),

  'Dumbbell Lateral Raise': (
    <>
      <Floor />
      <g>
        <Head x={60} y={22} />
        <path d="M60 29.5V48M51 52H69" />
        <path d="M52 52 50 66 50 81M68 52 70 66 70 81" />
        <path d="M50 34 30 34M70 34 90 34" />
      </g>
      <Dumbbell x={26} y={34} />
      <Dumbbell x={94} y={34} />
    </>
  ),

  'Face Pull': (
    <>
      <Floor />
      <Stack x={100} top={12} />
      <Cable d="M113 20 86 30" />
      <g>
        <Head x={46} y={26} />
        <path d="M46 33.5V50M38 54H54" />
        <path d="M39 54 36 68 36 81M53 54 56 68 56 81" />
        <path d="M44 36 62 30M48 40 64 34" />
      </g>
      <path className="stroke-signal-400" d="M66 24v12" />
      <Handle x={74} y={30} w={9} />
      <Cable d="M66 30h12" />
    </>
  ),

  'Barbell Curl': (
    <>
      <Floor />
      <g>
        <Head x={60} y={18} />
        <path d="M60 25.5V44M51 48H69" />
        <path d="M52 48 50 64 50 81M68 48 70 64 70 81" />
        <path d="M50 30 46 44 54 42M70 30 74 44 66 42" />
      </g>
      <Barbell x={60} y={42} hw={26} />
    </>
  ),

  'Hammer Curl': (
    <>
      <Floor />
      <g>
        <Head x={60} y={18} />
        <path d="M60 25.5V44M51 48H69" />
        <path d="M52 48 50 64 50 81M68 48 70 64 70 81" />
        <path d="M50 30 44 42 48 36M70 30 76 42 72 36" />
      </g>
      <Dumbbell x={46} y={32} a={90} />
      <Dumbbell x={74} y={32} a={90} />
    </>
  ),

  'Cable Curl': (
    <>
      <Floor />
      <Stack x={8} top={14} pulley="bottom" />
      <Cable d="M15 72 46 46" />
      <g>
        <Head x={62} y={20} />
        <path d="M62 27.5V46M53 50H71" />
        <path d="M54 50 52 66 52 81M70 50 72 66 72 81" />
        <path d="M53 32 48 46 56 42" />
        <path d="M71 32 74 46" />
      </g>
      <Handle x={48} y={46} w={9} />
    </>
  ),

  'Triceps Pushdown': (
    <>
      <Floor />
      <Stack x={100} top={12} />
      <Cable d="M113 20 78 24 70 48" />
      <g>
        <Head x={52} y={22} />
        <path d="M52 29.5V48M43 52H61" />
        <path d="M44 52 42 68 42 81M60 52 62 68 62 81" />
        <path d="M60 34 66 44 70 50" />
      </g>
      <Handle x={70} y={52} w={11} />
    </>
  ),

  'Skull Crusher': (
    <>
      <Floor />
      <Bench x={30} y={56} w={56} />
      <g>
        <Head x={36} y={48} />
        <path d="M43 50H66M66 50 80 56 80 72" />
        <path d="M66 50 74 56 74 72" />
        <path d="M52 52 56 36 44 34" />
      </g>
      <Barbell x={40} y={32} hw={20} />
    </>
  ),

  'Bench Dip': (
    <>
      <Floor />
      <Bench x={12} y={52} w={32} />
      <g>
        <Head x={56} y={34} />
        <path d="M56 41.5 60 58" />
        <path d="M60 58 84 68 94 72" />
        <path d="M60 58 86 72" />
        <path d="M52 44 44 44 42 52" />
      </g>
    </>
  ),

  'Barbell Row': (
    <>
      <Floor />
      <g>
        <Head x={40} y={30} />
        <path d="M47 33 72 40M66 44H78" />
        <path d="M70 44 68 62 66 81M76 44 80 62 78 81" />
        <path d="M54 36 50 50 58 48M62 38 58 52 66 50" />
      </g>
      <Barbell x={60} y={50} hw={26} />
    </>
  ),

  'One-Arm Dumbbell Row': (
    <>
      <Floor />
      <Bench x={54} y={56} w={44} />
      <g>
        <Head x={28} y={36} />
        <path d="M35 39 62 48M62 48 78 54" />
        <path d="M62 48 60 66 58 81" />
        <path d="M70 50 72 56" />
        <path d="M40 44 38 56 44 52" />
      </g>
      <Dumbbell x={44} y={58} />
    </>
  ),

  'Seated Cable Row': (
    <>
      <Floor />
      <Stack x={101} top={30} />
      <g className="stroke-signal-400">
        <path d="M22 66h30M26 66v12M48 66v12" />
      </g>
      <g>
        <Head x={38} y={40} />
        <path d="M38 47.5 42 64M42 64 70 66 84 76" />
        <path d="M44 46 62 52 56 56" />
      </g>
      <Cable d="M114 38 62 52" />
      <Handle x={62} y={52} w={9} />
    </>
  ),

  'Lat Pulldown': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M94 10v34M94 10H60" />
        <path d="M86 50h22M90 50v32M104 50v32" />
      </g>
      <g>
        <Head x={56} y={34} />
        <path d="M56 41.5V58M48 62H64" />
        <path d="M49 62 44 74 44 81M63 62 68 74 68 81" />
        <path d="M48 44 42 26M64 44 70 26" />
      </g>
      <Cable d="M60 10v12" />
      <Barbell x={56} y={24} hw={18} />
    </>
  ),

  'Pull-Up': (
    <>
      <g className="stroke-signal-400">
        <path d="M14 14h92M20 14v8M100 14v8" />
      </g>
      <g>
        <Head x={60} y={34} />
        <path d="M60 41.5V58M52 62H68" />
        <path d="M53 62 50 74 54 82M67 62 70 74 66 82" />
        <path d="M51 38 44 14M69 38 76 14" />
      </g>
    </>
  ),

  'Hanging Leg Raise': (
    <>
      <g className="stroke-signal-400">
        <path d="M14 12h92M20 12v8M100 12v8" />
      </g>
      <g>
        <path d="M46 16 52 36M72 16 66 36" />
        <Head x={59} y={26} r={7} />
        <path d="M52 36H66M59 36V56" />
        <path d="M59 56 85 50M59 56 83 59" />
      </g>
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M68 76q14-4 17-20" />
    </>
  ),

  Plank: (
    <>
      <Floor />
      <g>
        <Head x={26} y={50} />
        <path d="M33 52 62 58M62 58 88 68M88 68 92 81" />
        <path d="M30 58 28 70 40 70" />
        <path d="M62 58 60 70" />
      </g>
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M34 42h50" />
    </>
  ),

  'Cable Crunch': (
    <>
      <Floor />
      <Stack x={100} top={10} />
      <Cable d="M113 18 76 22 62 34" />
      <g>
        <Head x={48} y={40} />
        <path d="M48 47.5 54 58M54 58 44 72 26 76M54 58 70 74" />
        <path d="M52 42 60 34" />
      </g>
      <Handle x={62} y={34} w={9} />
    </>
  ),

  'Lying Leg Curl': (
    <>
      <Floor />
      <Bench x={16} y={58} w={60} />
      <g>
        <Head x={22} y={50} />
        <path d="M29 52 68 54M68 54 84 44" />
        <path d="M68 54 80 48" />
        <path d="M34 56 32 66" />
      </g>
      <g className="stroke-signal-400">
        <path d="M84 44h12M90 44v10" />
      </g>
    </>
  ),

  'Leg Press': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M86 16 104 34M84 18 102 36" />
        <path d="M14 70h34M18 70v12M44 70v12" />
      </g>
      <g>
        <Head x={26} y={56} />
        <path d="M33 58 50 64M50 64 76 44M76 44 88 32" />
        <path d="M50 64 74 50 86 38" />
        <path d="M34 62 44 70" />
      </g>
    </>
  ),

  'Standing Calf Raise': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M34 74h52M38 74v8M82 74v8" />
      </g>
      <g>
        <Head x={60} y={22} />
        <path d="M60 29.5V48M52 52H68" />
        <path d="M53 52 52 66 52 74M67 52 68 66 68 74" />
        <path d="M51 34 46 50M69 34 74 50" />
      </g>
    </>
  ),

  'Walking Lunge': (
    <>
      <Floor />
      <g>
        <Head x={54} y={20} />
        <path d="M54 27.5V46M46 50H62" />
        <path d="M60 50 80 60 80 81" />
        <path d="M48 50 34 66 42 78" />
        <path d="M46 32 42 48M62 32 66 48" />
      </g>
      <Dumbbell x={40} y={50} a={90} />
      <Dumbbell x={68} y={50} a={90} />
    </>
  ),

  'Kettlebell Swing': (
    <>
      <Floor />
      <g>
        <Head x={44} y={28} />
        <path d="M44 35.5 50 50M42 54H58" />
        <path d="M44 54 40 68 40 81M56 54 60 68 60 81" />
        <path d="M48 38 70 40" />
      </g>
      <Kettlebell x={78} y={40} />
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M60 62q14 4 22-8" />
    </>
  ),

  Burpee: (
    <>
      <Floor />
      <g>
        <Head x={60} y={16} />
        <path d="M52 26H68M60 26V42M53 46H67" />
        <path d="M53 46 48 58 56 63M67 46 72 58 64 63" />
        <path d="M52 28 45 13M68 28 75 13" />
      </g>
      <path className="stroke-signal-400" strokeWidth="2.2" strokeDasharray="4 5" d="M36 78q24-10 48 0" />
    </>
  ),

  'Rowing Machine': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M22 72h78M26 72v10M94 72v10" />
        <path d="M22 60v12" />
      </g>
      <g>
        <Head x={58} y={38} />
        <path d="M58 45.5 54 60M54 60 76 64M76 64 86 54" />
        <path d="M54 60 72 70 84 58" />
        <path d="M54 48 36 56" />
      </g>
      <Cable d="M22 62 36 56" />
      <Handle x={34} y={56} w={10} />
    </>
  ),

  'Treadmill Run': (
    <>
      <Floor />
      <g className="stroke-signal-400">
        <path d="M18 72h78M22 72v10M90 72v10" />
        <path d="M90 72V36h-16" />
      </g>
      <g>
        <Head x={52} y={24} />
        <path d="M52 31.5V48M44 52H60" />
        <path d="M46 52 36 64 40 72M58 52 66 60 62 72" />
        <path d="M50 36 40 44M58 36 68 38" />
      </g>
    </>
  ),
};

/** Fallbacks so a new exercise never renders an empty box. */
const byEquipment = {
  BARBELL: 'Barbell Curl',
  DUMBBELL: 'Dumbbell Lateral Raise',
  KETTLEBELL: 'Kettlebell Swing',
  CABLE: 'Triceps Pushdown',
  MACHINE: 'Lat Pulldown',
  BODYWEIGHT: 'Push-Up',
};

/**
 * Draws the illustration for an exercise. Falls back to a drawing that matches
 * the equipment when the name is one we have not drawn yet.
 */
export default function ExerciseArt({ name, equipment, className = '' }) {
  const scene = scenes[name] || scenes[byEquipment[equipment]] || scenes['Push-Up'];

  return (
    <svg
      viewBox="0 0 120 90"
      role="img"
      aria-label={`Illustration of ${name}`}
      className={`w-full ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {scene}
    </svg>
  );
}

export const hasArt = (name) => Boolean(scenes[name]);
