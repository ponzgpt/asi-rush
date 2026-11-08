// Signal store wrapping the pure sim: fixed 10 Hz ticks, event narration, persistence.
import { signal } from '@preact/signals';
import { BUILDING_ORDER, CLICK_UPGRADES, MODELS, RIVALS, SAVE, TICK_SECONDS } from '../data/economy.ts';
import { decode, encode } from '../save/codec.ts';
import {
  apply,
  newGame,
  powerCapMW,
  rivalCap,
  rivalReleases,
  simulateOffline,
  throttle,
  tick,
  type Action,
  type State,
} from '../sim/sim.ts';
import { fmt, fmtDuration, fmtPower } from '../ui/format.ts';
import { t, tk } from '../ui/i18n.ts';
import { emit } from './events.ts';

export const game = signal<State>(newGame());

export interface LogLine {
  id: number;
  at: number; // game seconds
  text: string;
  tone: 'info' | 'good' | 'warn';
}
export const log = signal<LogLine[]>([]);
export const headlines = signal<string[]>([]); // event-driven newswire items, newest first

const LAB_KEY = 'asi-rush-lab';
export const labName = signal<string>(readLab());

function readLab(): string {
  try {
    return localStorage.getItem(LAB_KEY) ?? '';
  } catch {
    return '';
  }
}

/** True once the player has gone through the briefing on this device. */
export function hasStarted(): boolean {
  try {
    return localStorage.getItem(LAB_KEY) !== null;
  } catch {
    return false;
  }
}

export function setLabName(name: string) {
  labName.value = name.trim().slice(0, 32);
  try {
    localStorage.setItem(LAB_KEY, labName.value);
  } catch {
    /* storage unavailable */
  }
}

export function displayLab(): string {
  return labName.value || t('labNameDefault');
}

/** "Garage Intelligence" -> "GI". Used to name the player's models. */
export function modelPrefix(): string {
  const initials = displayLab()
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return initials.slice(0, 3) || 'GI';
}

const MODEL_SUFFIX = ['1', '2', '3', '4', '4 Turbo', '5', '6', '7', '7o', '8', '9', 'X', 'Omega'];

export function modelName(index: number): string {
  return `${modelPrefix()}-${MODEL_SUFFIX[index] ?? String(index + 1)}`;
}

// Rival model names, one parody per lab.
const RIVAL_MODEL: Record<string, (n: number) => string> = {
  closedai: (n) => `GPP-${n}`,
  misanthropic: (n) => `Clod ${n}`,
  yai: (n) => `Grump ${n}`,
  shallowmind: (n) => `Gemenot ${n}`,
};

export function rivalModelName(id: string, n: number): string {
  return RIVAL_MODEL[id]?.(n) ?? `${id} ${n}`;
}

let logId = 0;
export function pushLog(text: string, tone: LogLine['tone'] = 'info') {
  log.value = [{ id: ++logId, at: game.value.time, text, tone }, ...log.value].slice(0, 40);
}

function pushHeadline(text: string) {
  headlines.value = [text, ...headlines.value].slice(0, 6);
}

function rivalsAhead(s: State): Set<string> {
  const me = s.capability.toNumber();
  return new Set(RIVALS.filter((r) => rivalCap(r, s.time) > me).map((r) => r.id));
}

/** Turn state transitions into log lines, headlines and events. */
function narrate(prev: State, next: State) {
  for (const id of BUILDING_ORDER) {
    if (prev.owned[id] === 0 && next.owned[id] > 0) pushLog(t(`ev.first.${id}` as 'ev.first.homePc'), 'good');
  }
  if (next.fuseLevel > prev.fuseLevel) {
    pushLog(t('ev.fuse', { n: fmtPower(powerCapMW(next)) }), 'good');
    emit('fuse');
  }
  const before = throttle(prev);
  const after = throttle(next);
  if (before === 1 && after < 1) {
    pushLog(t('ev.throttle', { n: Math.round(after * 100) }), 'warn');
    emit('throttle');
  }
  if (next.research.length > prev.research.length) {
    const id = next.research[next.research.length - 1] ?? '';
    pushLog(t('ev.research', { name: tk(`r.${id}`) }), 'good');
    emit('research');
  }
  if (next.modelsShipped > prev.modelsShipped) {
    const i = next.modelsShipped - 1;
    const model = modelName(i);
    pushLog(t('ev.ship', { model, n: fmt(MODELS[i]?.hypeCash ?? 0) }), 'good');
    pushHeadline(t('news.ship', { lab: displayLab(), model }));
    emit('ship');
  }
  const aheadBefore = rivalsAhead(prev);
  const aheadAfter = rivalsAhead(next);
  const rank = aheadAfter.size + 1;
  for (const id of aheadBefore) {
    if (aheadAfter.has(id)) continue;
    const lab = tk(`rival.${id}`);
    pushLog(t('ev.overtake', { lab, n: rank }), 'good');
    pushHeadline(t('news.overtake', { lab, n: rank }));
    emit('overtake');
  }
  for (const id of aheadAfter) {
    if (aheadBefore.has(id) || prev.time === 0) continue;
    pushLog(t('ev.overtaken', { lab: tk(`rival.${id}`), n: rank }), 'warn');
    emit('overtaken');
  }
  if (next.clickUpgrades > prev.clickUpgrades) {
    const id = CLICK_UPGRADES[next.clickUpgrades - 1]?.id ?? '';
    pushLog(t('ev.click', { name: tk(`c.${id}`) }), 'good');
    emit('click');
  }
  // rival releases: every step on their curve is a launch
  for (const r of RIVALS) {
    const before = rivalReleases(r, prev.time);
    const after = rivalReleases(r, next.time);
    if (after > before && prev.time > 0) {
      const model = rivalModelName(r.id, after + 1);
      pushHeadline(tk(`news.rival.${r.id}`, { model }));
      pushLog(t('ev.rival', { lab: tk(`rival.${r.id}`), model }), 'info');
      emit('rival');
    }
  }
  if (!prev.roundClosed && next.roundClosed) {
    pushLog(tk(`ev.round.${next.era}`), 'good');
    pushHeadline(tk(`news.round.${next.era}`, { lab: displayLab() }));
    emit(next.outcome === 'won' ? 'victory' : 'round');
  }
  if (next.era > prev.era) {
    pushLog(tk(`ev.era.${next.era}`), 'good');
    emit('era');
    saveEraStart(next);
  }
  if (!prev.outcome && (next.outcome === 'lost' || next.outcome === 'doom')) {
    pushLog(
      next.outcome === 'doom' ? t('ev.doom') : t('ev.lost', { lab: tk(`rival.${next.lostTo ?? ''}`) }),
      'warn',
    );
    emit('defeat');
  }
}

function commit(next: State) {
  const prev = game.value;
  if (next === prev) return;
  narrate(prev, next);
  game.value = next;
}

/** Apply a player action. Returns false when the sim refused it (e.g. not enough cash). */
export function dispatch(action: Action): boolean {
  const prev = game.value;
  const next = apply(prev, action);
  if (next === prev) {
    if (action.type !== 'setTrainShare') emit('denied');
    return false;
  }
  commit(next);
  if (action.type === 'benchmark') emit('benchmark');
  if (action.type === 'buy') emit('buy');
  return true;
}

// --- era snapshots: a lost round can be replayed from its start ------------

const ERA_KEY = 'asi-rush-era-start';

/** Remember the current state as the start of this era (new game or era change). */
export function saveEraStartNow() {
  saveEraStart(game.value);
}

function saveEraStart(s: State) {
  try {
    localStorage.setItem(ERA_KEY, encode(s, Date.now()));
  } catch {
    /* storage unavailable */
  }
}

/** Restart the current era from the moment it began (no offline catch-up). */
export function retryEra(): boolean {
  try {
    const snap = decode(localStorage.getItem(ERA_KEY) ?? '');
    const state = snap?.state ?? newGame();
    game.value = state;
    log.value = [];
    headlines.value = [];
    save();
    return true;
  } catch {
    return false;
  }
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
  log.value = [];
  if (away > 60) {
    pushLog(
      t('ev.welcome', {
        t: fmtDuration(Math.min(away, 24 * 3600)),
        cash: fmt(caughtUp.cash.sub(loaded.state.cash)),
        cap: fmt(caughtUp.capability.sub(loaded.state.capability)),
      }),
      'good',
    );
  }
  return true;
}

export function resetGame() {
  game.value = newGame();
  log.value = [];
  headlines.value = [];
  saveEraStart(game.value);
  save();
}

// --- loop ----------------------------------------------------------------

/** Load the saved run (with offline catch-up). The clock does not run until startLoop(). */
export function load() {
  try {
    const stored = localStorage.getItem(SAVE.storageKey);
    if (stored) loadSave(stored);
  } catch {
    /* storage unavailable */
  }
}

let running = false;
export function startLoop() {
  if (running) return;
  running = true;
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
