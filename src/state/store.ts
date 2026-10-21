// Signal store wrapping the pure sim: fixed 10 Hz ticks, event log, persistence.
import { signal } from '@preact/signals';
import { BUILDINGS, SAVE, TICK_SECONDS } from '../data/economy.ts';
import { decode, encode } from '../save/codec.ts';
import { apply, newGame, simulateOffline, throttle, tick, type Action, type State } from '../sim/sim.ts';
import { fmt, fmtDuration } from '../ui/format.ts';
import { t } from '../ui/i18n.ts';

export const game = signal<State>(newGame());
export const log = signal<string[]>([]);

const LOG_MAX = 30;
export function pushLog(line: string) {
  log.value = [line, ...log.value].slice(0, LOG_MAX);
}

/** Turn state transitions into player-facing log lines. */
function narrate(prev: State, next: State) {
  if (prev.firstTrainingAt === null && next.firstTrainingAt !== null) pushLog(t('firstTraining'));
  if (prev.eraCompleteAt === null && next.eraCompleteAt !== null) pushLog(t('eraComplete'));
  if (next.fuseLevel === 1 && prev.fuseLevel === 0) pushLog(t('firstFuse'));
  for (const id of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    if (next.owned[id] === 1 && prev.owned[id] === 0) pushLog(t('bought', { name: t(id) }));
  }
  if (throttle(prev) === 1 && throttle(next) < 1) pushLog(t('overPower'));
}

function commit(next: State) {
  const prev = game.value;
  if (next === prev) return;
  narrate(prev, next);
  game.value = next;
}

export function dispatch(action: Action) {
  commit(apply(game.value, action));
}

// --- persistence ---------------------------------------------------------

export function save() {
  try {
    localStorage.setItem(SAVE.storageKey, encode(game.value, Date.now()));
  } catch {
    /* storage unavailable: progress lives only in memory */
  }
}

export function exportSave(): string {
  return encode(game.value, Date.now());
}

/** Load a save string (from storage or import) and catch up on offline time. */
export function loadSave(text: string): boolean {
  const loaded = decode(text);
  if (!loaded) return false;
  const away = (Date.now() - loaded.savedAt) / 1000;
  const caughtUp = simulateOffline(loaded.state, away);
  game.value = caughtUp;
  if (away > 60) {
    pushLog(
      t('welcomeBack', {
        t: fmtDuration(away),
        cash: fmt(caughtUp.cash.sub(loaded.state.cash)),
        cap: fmt(caughtUp.capability.sub(loaded.state.capability)),
      }),
    );
  }
  return true;
}

export function resetGame() {
  game.value = newGame();
  log.value = [];
  save();
}

// --- loop ----------------------------------------------------------------

export function start() {
  try {
    const stored = localStorage.getItem(SAVE.storageKey);
    if (stored) loadSave(stored);
  } catch {
    /* storage unavailable */
  }

  let last = performance.now();
  let acc = 0;
  setInterval(() => {
    const now = performance.now();
    acc += (now - last) / 1000;
    last = now;
    // A throttled background tab can stall for minutes: catch up in coarse steps.
    if (acc > 5) {
      commit(simulateOffline(game.value, acc));
      acc = 0;
      return;
    }
    let s = game.value;
    while (acc >= TICK_SECONDS) {
      s = tick(s);
      acc -= TICK_SECONDS;
    }
    commit(s);
  }, TICK_SECONDS * 1000);

  setInterval(save, SAVE.autosaveSeconds * 1000);
  document.addEventListener('visibilitychange', () => document.hidden && save());
  window.addEventListener('pagehide', save);
}
