// Coach marks: a pulsing ring around the control that matters right now, plus a speech bubble.
// Tutorial steps follow the objective list; after (or alongside) it, contextual tips fire once each
// when their moment comes (P(doom) rising, a rival close to the goal, a new era...).
import { useEffect, useState } from 'preact/hooks';
import { eraOf, nextClickUpgrade, pDoom, rates, rivalEta, type State } from '../sim/sim.ts';
import { game } from '../state/store.ts';
import { t, type Key } from './i18n.ts';
import { OBJECTIVES, currentObjective } from './objectives.ts';

const STEPS: Partial<Record<Key, { target: string; text: Key }>> = {
  'obj.benchmark': { target: 'benchmark', text: 'coach.benchmark' },
  'obj.pc': { target: 'pc', text: 'coach.pc' },
  'obj.train': { target: 'alloc', text: 'coach.train' },
  'obj.ship': { target: 'ship', text: 'coach.ship' },
  'obj.research': { target: 'research', text: 'coach.research' },
  'obj.card': { target: 'card', text: 'coach.card' },
  'obj.fuse': { target: 'fuse', text: 'coach.fuse' },
  'obj.rank': { target: 'rank', text: 'coach.rank' },
  'obj.goal': { target: 'goal', text: 'coach.goal' },
};

interface Tip {
  id: string;
  target: string;
  text: Key;
  when: (s: State) => boolean;
}

/** Seconds the player needs to reach the era goal at the current training rate (Infinity if stalled). */
function playerEta(s: State): number {
  const per = rates(s).capPerSec.toNumber();
  const gap = eraOf(s).goal - s.capability.toNumber();
  return per > 0 ? gap / per : Infinity;
}

const TIPS: Tip[] = [
  {
    id: 'click',
    target: 'clickup',
    text: 'tip.click',
    when: (s) => s.clickUpgrades === 0 && s.cash.gte(nextClickUpgrade(s)?.cost ?? Infinity),
  },
  { id: 'pdoom', target: 'pdoom', text: 'tip.pdoom', when: (s) => pDoom(s) >= 0.15 },
  ...([1, 2, 3, 4] as const).map((era): Tip => ({
    id: `era${era}`,
    target: 'goal',
    text: `tip.era${era}`,
    when: (s) => s.era === era,
  })),
  ...[0, 1, 2, 3, 4].map((era): Tip => ({
    id: `deadline${era}`,
    target: 'goal',
    text: 'tip.deadline',
    when: (s) => {
      if (s.era !== era || s.roundClosed || s.time < 120) return false;
      const rival = rivalEta(s.time, eraOf(s).goal, 240);
      return rival !== null && rival < playerEta(s);
    },
  })),
];

const SKIP_KEY = 'asi-rush-tutorial';
const TIPS_KEY = 'asi-rush-tips';

function readSkipped(): boolean {
  try {
    return localStorage.getItem(SKIP_KEY) === 'off';
  } catch {
    return false;
  }
}

function readSeen(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(TIPS_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Active {
  key: string;
  target: string;
  text: Key;
  tag: string;
  dismiss: () => void;
}

export function Coach(p: { paused: boolean }) {
  const [skipped, setSkipped] = useState(readSkipped);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [seen, setSeen] = useState(readSeen);
  const [box, setBox] = useState<Box | null>(null);
  const s = game.value;

  const index = currentObjective(s);
  const objective = OBJECTIVES[index];
  const step = objective ? STEPS[objective.key] : undefined;
  let active: Active | null = null;
  if (!skipped && step && !dismissed.has(index)) {
    active = {
      key: `obj${index}`,
      target: step.target,
      text: step.text,
      tag: t('coachTag', { i: index + 1, n: OBJECTIVES.length }),
      dismiss: () => setDismissed((d) => new Set(d).add(index)),
    };
  } else {
    const tip = TIPS.find((x) => !seen.has(x.id) && x.when(s));
    if (tip) {
      active = {
        key: tip.id,
        target: tip.target,
        text: tip.text,
        tag: t('tipTag'),
        dismiss: () => {
          const next = new Set(seen).add(tip.id);
          setSeen(next);
          try {
            localStorage.setItem(TIPS_KEY, JSON.stringify([...next]));
          } catch {
            /* storage unavailable */
          }
        },
      };
    }
  }
  if (p.paused) active = null;
  const target = active?.target;

  // track the target's position every frame: panels scroll, cards appear and move
  useEffect(() => {
    if (!target) {
      setBox(null);
      return;
    }
    let raf = 0;
    let scrolled = false;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-coach="${target}"]`);
      const r = el?.getBoundingClientRect();
      if (!el || !r || r.width === 0) setBox(null);
      else {
        if (!scrolled) {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          scrolled = true;
        }
        setBox((b) =>
          b && b.x === r.left && b.y === r.top && b.w === r.width && b.h === r.height
            ? b
            : { x: r.left, y: r.top, w: r.width, h: r.height },
        );
      }
      raf = requestAnimationFrame(find);
    };
    find();
    return () => cancelAnimationFrame(raf);
  }, [target, active?.key]);

  if (!active || !box) return null;

  const pad = 6;
  const bubbleW = Math.min(340, window.innerWidth - 24);
  const below = box.y + box.h + 170 < window.innerHeight;
  const left = Math.max(12, Math.min(window.innerWidth - bubbleW - 12, box.x + box.w / 2 - bubbleW / 2));
  const arrowX = Math.max(16, Math.min(bubbleW - 16, box.x + box.w / 2 - left));

  const skip = () => {
    setSkipped(true);
    try {
      localStorage.setItem(SKIP_KEY, 'off');
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <>
      <div
        class="coach-ring"
        style={{
          left: `${box.x - pad}px`,
          top: `${box.y - pad}px`,
          width: `${box.w + pad * 2}px`,
          height: `${box.h + pad * 2}px`,
        }}
      />
      <div
        class={`coach-bubble ${below ? 'below' : 'above'}`}
        role="dialog"
        aria-live="polite"
        style={{
          left: `${left}px`,
          width: `${bubbleW}px`,
          ...(below
            ? { top: `${box.y + box.h + pad + 12}px` }
            : { bottom: `${window.innerHeight - box.y + pad + 12}px` }),
          '--arrow-x': `${arrowX}px`,
        }}
      >
        <div class="coach-tag">{active.tag}</div>
        <p>{t(active.text)}</p>
        <div class="coach-actions">
          {active.key.startsWith('obj') && (
            <button class="seg seg-sm" onClick={skip}>
              {t('coachSkip')}
            </button>
          )}
          <button class="seg seg-sm active" onClick={active.dismiss}>
            {t('coachNext')}
          </button>
        </div>
      </div>
    </>
  );
}
