// Coach marks: a pulsing ring around the control the current objective needs, plus a speech bubble.
// Steps follow the objective list, so the tutorial advances by itself as the player does things.
import { useEffect, useState } from 'preact/hooks';
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

const KEY = 'asi-rush-tutorial';

function readSkipped(): boolean {
  try {
    return localStorage.getItem(KEY) === 'off';
  } catch {
    return false;
  }
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Coach(p: { paused: boolean }) {
  const [skipped, setSkipped] = useState(readSkipped);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [box, setBox] = useState<Box | null>(null);
  const index = currentObjective(game.value);
  const objective = OBJECTIVES[index];
  const step = objective ? STEPS[objective.key] : undefined;
  const active = !skipped && !p.paused && step !== undefined && !dismissed.has(index);

  // track the target's position every frame: panels scroll, cards appear and move
  useEffect(() => {
    if (!active || !step) {
      setBox(null);
      return;
    }
    let raf = 0;
    let scrolled = false;
    const find = () => {
      const el = document.querySelector<HTMLElement>(`[data-coach="${step.target}"]`);
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
  }, [active, step?.target]);

  if (!active || !step || !box) return null;

  const pad = 6;
  const bubbleW = Math.min(320, window.innerWidth - 24);
  const below = box.y + box.h + 160 < window.innerHeight;
  const left = Math.max(12, Math.min(window.innerWidth - bubbleW - 12, box.x + box.w / 2 - bubbleW / 2));
  const arrowX = Math.max(16, Math.min(bubbleW - 16, box.x + box.w / 2 - left));
  const steps = OBJECTIVES.length;

  const skip = () => {
    setSkipped(true);
    try {
      localStorage.setItem(KEY, 'off');
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
        <div class="coach-tag">{t('coachTag', { i: index + 1, n: steps })}</div>
        <p>{t(step.text)}</p>
        <div class="coach-actions">
          <button class="seg seg-sm" onClick={skip}>
            {t('coachSkip')}
          </button>
          <button class="seg seg-sm active" onClick={() => setDismissed((d) => new Set(d).add(index))}>
            {t('coachNext')}
          </button>
        </div>
      </div>
    </>
  );
}
