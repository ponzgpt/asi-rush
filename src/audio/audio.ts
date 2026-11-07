// All sound is synthesized with WebAudio: no audio assets to load or license.
// SFX are short envelopes on oscillators/noise; the score is a small step sequencer
// in the spirit of 80s analog synth soundtracks (driving 8th-note bass, slow pads).
import { signal } from '@preact/signals';
import type { GameEvent } from '../state/events.ts';

const PREFS_KEY = 'asi-rush-audio';

interface Prefs {
  sfx: boolean;
  music: boolean;
}

function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { sfx: true, music: true, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* storage unavailable or bad JSON */
  }
  return { sfx: true, music: true };
}

export const audioPrefs = signal<Prefs>(readPrefs());

let ctx: AudioContext | null = null;
let sfxBus: GainNode;
let musicBus: GainNode;
let humGain: GainNode;
let noise: AudioBuffer;

export function setAudioPrefs(p: Partial<Prefs>) {
  audioPrefs.value = { ...audioPrefs.value, ...p };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(audioPrefs.value));
  } catch {
    /* storage unavailable */
  }
  if (!ctx) return;
  const now = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(audioPrefs.value.sfx ? 0.5 : 0, now, 0.05);
  musicBus.gain.setTargetAtTime(audioPrefs.value.music ? 0.32 : 0, now, 0.3);
}

/** Browsers only allow audio after a user gesture: call from the first click/keypress. */
export function unlockAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  const master = ctx.createDynamicsCompressor();
  master.threshold.value = -14;
  master.ratio.value = 4;
  master.connect(ctx.destination);

  sfxBus = ctx.createGain();
  musicBus = ctx.createGain();
  sfxBus.connect(master);
  musicBus.connect(master);

  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < data.length; i++) {
    brown = (brown + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = brown * 3.5;
  }

  // Room tone: brown noise through a lowpass, louder as the lab grows (fans, transformers).
  const hum = ctx.createBufferSource();
  hum.buffer = noise;
  hum.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  humGain = ctx.createGain();
  humGain.gain.value = 0;
  hum.connect(lp).connect(humGain).connect(sfxBus);
  hum.start();

  setAudioPrefs({});
  startMusic();
}

// --- SFX -----------------------------------------------------------------

function tone(
  freq: number,
  at: number,
  dur: number,
  opts: { type?: OscillatorType; gain?: number; to?: number; bus?: GainNode; attack?: number } = {},
) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = opts.type ?? 'square';
  osc.frequency.setValueAtTime(freq, at);
  if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, at + dur);
  const peak = opts.gain ?? 0.2;
  const attack = opts.attack ?? 0.005;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(opts.bus ?? sfxBus);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

function burst(at: number, dur: number, gain: number, freq: number, bus: GainNode = sfxBus) {
  if (!ctx) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const f = ctx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gain, at);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(bus);
  src.start(at, Math.random() * 1.5, dur + 0.05);
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

const SFX: Record<GameEvent, (now: number) => void> = {
  benchmark: (now) => {
    const base = 76 + Math.floor(Math.random() * 3) * 2;
    tone(midi(base), now, 0.05, { gain: 0.1 });
    tone(midi(base + 7), now + 0.04, 0.06, { gain: 0.08 });
    burst(now, 0.03, 0.15, 4000);
  },
  buy: (now) => {
    tone(midi(72), now, 0.07, { gain: 0.14 });
    tone(midi(79), now + 0.06, 0.12, { gain: 0.14 });
  },
  denied: (now) => tone(110, now, 0.14, { type: 'sawtooth', gain: 0.08, to: 80 }),
  fuse: (now) => {
    burst(now, 0.25, 0.4, 1500);
    tone(midi(48), now, 0.4, { type: 'sawtooth', gain: 0.12, to: midi(60) });
  },
  throttle: (now) => {
    for (let i = 0; i < 3; i++) {
      tone(880, now + i * 0.22, 0.1, { gain: 0.08 });
      tone(660, now + i * 0.22 + 0.11, 0.1, { gain: 0.08 });
    }
  },
  research: (now) =>
    [72, 76, 79, 84].forEach((n, i) => tone(midi(n), now + i * 0.07, 0.18, { type: 'triangle', gain: 0.18 })),
  ship: (now) => {
    [60, 64, 67, 72].forEach((n) => tone(midi(n), now, 0.9, { type: 'sawtooth', gain: 0.05, attack: 0.02 }));
    [72, 76, 79, 84, 88].forEach((n, i) =>
      tone(midi(n), now + 0.1 + i * 0.06, 0.25, { type: 'square', gain: 0.07 }),
    );
    burst(now, 0.6, 0.15, 6000);
  },
  overtake: (now) =>
    [79, 84, 91].forEach((n, i) => tone(midi(n), now + i * 0.09, 0.3, { type: 'triangle', gain: 0.16 })),
  overtaken: (now) =>
    [64, 60].forEach((n, i) => tone(midi(n), now + i * 0.16, 0.3, { type: 'triangle', gain: 0.12 })),
  victory: (now) => {
    const chords = [
      [57, 64, 69, 72],
      [53, 60, 65, 69],
      [55, 62, 67, 71],
      [57, 64, 69, 76],
    ];
    chords.forEach((c, i) =>
      c.forEach((n) => tone(midi(n), now + i * 0.42, 0.6, { type: 'sawtooth', gain: 0.05, attack: 0.03 })),
    );
    [81, 84, 88, 93].forEach((n, i) =>
      tone(midi(n), now + 1.26 + i * 0.08, 0.5, { type: 'triangle', gain: 0.12 }),
    );
  },
  ui: (now) => tone(midi(84), now, 0.03, { gain: 0.05 }),
};

export function playSfx(e: GameEvent) {
  if (!ctx || !audioPrefs.value.sfx) return;
  SFX[e](ctx.currentTime + 0.01);
}

/** 0..1, how loud the room tone is. */
export function setHum(level: number) {
  if (!ctx) return;
  humGain.gain.setTargetAtTime(Math.min(1, level) * 0.25, ctx.currentTime, 0.5);
}

// --- music ---------------------------------------------------------------
// Original 8-bar loop in A minor: i - i - VI - VII, 104 BPM. Layers enter with intensity.

const BPM = 104;
const STEP = 60 / BPM / 2; // eighth notes
const PROGRESSION = [45, 45, 41, 43, 45, 45, 41, 40]; // bass roots per bar (A2 A2 F2 G2 A2 A2 F2 E2)
const PATTERN = [0, 0, 12, 0, 0, 12, 0, 7]; // per eighth, semitones above the root
const CHORD = (root: number) => [root + 12, root + (root === 45 ? 15 : 16), root + 19]; // Am minor, others major

export const musicIntensity = signal(0); // 0 bass only, 1 + pads, 2 + arpeggio, 3 + drums
let step = 0;
let nextAt = 0;

function startMusic() {
  if (!ctx) return;
  nextAt = ctx.currentTime + 0.1;
  setInterval(schedule, 25);
}

function schedule() {
  if (!ctx) return;
  while (nextAt < ctx.currentTime + 0.12) {
    playStep(step, nextAt);
    nextAt += STEP;
    step = (step + 1) % (PROGRESSION.length * 8);
  }
}

function playStep(i: number, at: number) {
  const bar = Math.floor(i / 8);
  const beat = i % 8;
  const root = PROGRESSION[bar] ?? 45;
  const level = musicIntensity.value;

  // bass: plucky square through the music bus
  tone(midi(root + (PATTERN[beat] ?? 0)), at, STEP * 0.9, { type: 'square', gain: 0.09, bus: musicBus });
  tone(midi(root - 12), at, STEP * 0.9, { type: 'triangle', gain: 0.12, bus: musicBus });

  if (level >= 1 && beat === 0) {
    for (const n of CHORD(root)) {
      tone(midi(n), at, STEP * 8, { type: 'sawtooth', gain: 0.022, attack: STEP * 3, bus: musicBus });
      tone(midi(n) * 1.004, at, STEP * 8, { type: 'sawtooth', gain: 0.018, attack: STEP * 3, bus: musicBus });
    }
  }
  if (level >= 2 && bar % 2 === 1) {
    const arp = CHORD(root).map((n) => n + 12);
    tone(midi(arp[beat % 3] ?? 69), at, STEP * 0.7, { type: 'triangle', gain: 0.05, bus: musicBus });
  }
  if (level >= 3) {
    if (beat % 4 === 0) tone(110, at, 0.18, { type: 'sine', gain: 0.25, to: 40, bus: musicBus });
    if (beat % 2 === 1) burst(at, 0.04, 0.06, 7000, musicBus);
  }
}
