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
  click: (now) =>
    [76, 83, 88].forEach((n, i) => tone(midi(n), now + i * 0.05, 0.12, { type: 'square', gain: 0.08 })),
  rival: (now) => {
    tone(midi(52), now, 0.25, { type: 'sawtooth', gain: 0.05 });
    tone(midi(59), now + 0.08, 0.3, { type: 'sawtooth', gain: 0.04 });
  },
  round: (now) => SFX.victory(now),
  era: (now) =>
    [57, 64, 69, 76, 81].forEach((n, i) =>
      tone(midi(n), now + i * 0.12, 0.6, { type: 'triangle', gain: 0.12 }),
    ),
  defeat: (now) => {
    [64, 60, 57, 52].forEach((n, i) => tone(midi(n), now + i * 0.3, 0.5, { type: 'sawtooth', gain: 0.07 }));
    burst(now + 1.1, 0.8, 0.2, 400);
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
// Five original synth tracks in the spirit of 80s analog soundtracks (driving 8th-note bass, slow pads,
// arpeggios, filtered saw leads). Each track has 4-6 sections; each pass re-rolls the lead melody from a
// seeded RNG. The player rotates tracks every two passes, from a playlist that changes with the era.
// Layers gate on game progress: 0 bass + pad, 1 + arpeggio, 2 + lead, 3 + drums.

type Numeral = 'i' | 'ii' | 'III' | 'iv' | 'v' | 'V' | 'VI' | 'VII' | 'bII';
const NUMERALS: Record<Numeral, [semitones: number, minor: boolean]> = {
  i: [0, true],
  ii: [2, true],
  III: [3, false],
  iv: [5, true],
  v: [7, true],
  V: [7, false],
  VI: [8, false],
  VII: [10, false],
  bII: [1, false],
};

type Arp = 'none' | 'up' | 'down' | 'pulse' | 'run';
interface Section {
  bars: Numeral[];
  bass: (number | null)[]; // 8 steps: semitones above the chord root, null = rest
  arp: Arp;
  lead: boolean;
  drums: 0 | 1 | 2 | 3; // none, kick + hats, full, half-time
}
interface Track {
  id: string;
  bpm: number;
  key: number; // MIDI note of the tonic in the bass octave
  bassWave: OscillatorType;
  leadCutoff: number;
  eras: number[]; // eras whose playlist includes this track
  sections: Section[];
}

const DRIVE = [0, 0, 12, 0, 0, 12, 0, 7];
const OCTAVES = [0, 12, 0, 12, 0, 12, 0, 12];
const PULSE = [0, 0, 0, 0, 0, 0, 0, 0];
const SPARSE = [0, null, null, null, 0, null, null, null];
const SYNC = [0, null, 0, 12, null, 0, 7, null];
const LONG = [0, null, null, null, null, null, null, null];

const TRACKS: Track[] = [
  {
    id: 'garage-nights',
    bpm: 104,
    key: 45, // A
    bassWave: 'square',
    leadCutoff: 2400,
    eras: [0, 1],
    sections: [
      { bars: ['i', 'i', 'i', 'i'], bass: PULSE, arp: 'none', lead: false, drums: 0 },
      { bars: ['i', 'i', 'VI', 'VII', 'i', 'i', 'VI', 'V'], bass: DRIVE, arp: 'up', lead: false, drums: 1 },
      { bars: ['i', 'i', 'VI', 'VII', 'i', 'i', 'VI', 'V'], bass: DRIVE, arp: 'up', lead: true, drums: 1 },
      {
        bars: ['iv', 'iv', 'i', 'i', 'VI', 'VI', 'V', 'V'],
        bass: OCTAVES,
        arp: 'down',
        lead: true,
        drums: 2,
      },
      { bars: ['VI', 'VII', 'i', 'i'], bass: SPARSE, arp: 'pulse', lead: false, drums: 0 },
      {
        bars: ['i', 'III', 'VII', 'iv', 'i', 'III', 'VII', 'V'],
        bass: SYNC,
        arp: 'up',
        lead: true,
        drums: 2,
      },
    ],
  },
  {
    id: 'cold-boot',
    bpm: 92,
    key: 38, // D
    bassWave: 'sawtooth',
    leadCutoff: 1600,
    eras: [0, 1, 2],
    sections: [
      { bars: ['i', 'i', 'VI', 'VII'], bass: LONG, arp: 'none', lead: false, drums: 0 },
      {
        bars: ['i', 'i', 'VI', 'VII', 'i', 'i', 'iv', 'V'],
        bass: SPARSE,
        arp: 'pulse',
        lead: false,
        drums: 0,
      },
      { bars: ['i', 'i', 'VI', 'VII', 'i', 'i', 'iv', 'V'], bass: SPARSE, arp: 'up', lead: true, drums: 3 },
      {
        bars: ['VI', 'VI', 'III', 'III', 'iv', 'iv', 'V', 'V'],
        bass: DRIVE,
        arp: 'run',
        lead: true,
        drums: 3,
      },
    ],
  },
  {
    id: 'neon-overclock',
    bpm: 120,
    key: 40, // E
    bassWave: 'square',
    leadCutoff: 3200,
    eras: [1, 2],
    sections: [
      { bars: ['i', 'VI', 'III', 'VII'], bass: OCTAVES, arp: 'run', lead: false, drums: 1 },
      {
        bars: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'V'],
        bass: DRIVE,
        arp: 'run',
        lead: true,
        drums: 2,
      },
      { bars: ['iv', 'iv', 'i', 'i', 'VI', 'VII', 'V', 'V'], bass: OCTAVES, arp: 'up', lead: true, drums: 2 },
      { bars: ['VI', 'VII', 'i', 'i'], bass: SPARSE, arp: 'pulse', lead: false, drums: 0 },
      {
        bars: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'VII', 'V'],
        bass: SYNC,
        arp: 'down',
        lead: true,
        drums: 2,
      },
    ],
  },
  {
    id: 'scaling-laws',
    bpm: 110,
    key: 36, // C
    bassWave: 'triangle',
    leadCutoff: 2000,
    eras: [0, 1, 2],
    sections: [
      { bars: ['i', 'VI', 'III', 'VII'], bass: SPARSE, arp: 'pulse', lead: false, drums: 0 },
      { bars: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'iv', 'V'], bass: SYNC, arp: 'up', lead: false, drums: 1 },
      { bars: ['i', 'VI', 'III', 'VII', 'i', 'VI', 'iv', 'V'], bass: SYNC, arp: 'up', lead: true, drums: 1 },
      {
        bars: ['VI', 'iv', 'i', 'V', 'VI', 'iv', 'VII', 'VII'],
        bass: DRIVE,
        arp: 'down',
        lead: true,
        drums: 2,
      },
    ],
  },
  {
    id: 'doom-clock',
    bpm: 126,
    key: 42, // F#
    bassWave: 'sawtooth',
    leadCutoff: 2800,
    eras: [2],
    sections: [
      { bars: ['i', 'i', 'bII', 'i'], bass: PULSE, arp: 'pulse', lead: false, drums: 1 },
      { bars: ['i', 'i', 'VI', 'bII', 'i', 'i', 'VII', 'V'], bass: DRIVE, arp: 'run', lead: true, drums: 2 },
      {
        bars: ['iv', 'iv', 'bII', 'bII', 'i', 'i', 'V', 'V'],
        bass: OCTAVES,
        arp: 'down',
        lead: true,
        drums: 2,
      },
      { bars: ['VI', 'bII', 'i', 'i'], bass: LONG, arp: 'none', lead: false, drums: 0 },
    ],
  },
];

const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const RHYTHMS = [
  [0, 3, 4, 6],
  [0, 2, 4],
  [0, 4, 5, 6],
  [0, 6],
  [0, 1, 2, 4, 6],
  [0, 3, 6],
];

function chord(track: Track, numeral: Numeral): { root: number; tones: number[] } {
  const [off, minor] = NUMERALS[numeral];
  const root = track.key + off;
  return { root, tones: [root + 12, root + (minor ? 15 : 16), root + 19] };
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function snapToScale(n: number, key: number): number {
  const rel = (((n - key) % 12) + 12) % 12;
  const best = MINOR_SCALE.reduce((b, d) => (Math.abs(d - rel) < Math.abs(b - rel) ? d : b), 0);
  return n - rel + best;
}

/** Lead line for one section and variant: per bar, 8 steps of MIDI notes or null. */
const leadCache = new Map<string, (number | null)[][]>();
function leadLine(ti: number, si: number, variant: number): (number | null)[][] {
  const key = `${ti}:${si}:${variant}`;
  const hit = leadCache.get(key);
  if (hit) return hit;
  const track = TRACKS[ti] as Track;
  const sec = track.sections[si] as Section;
  const r = rng(ti * 7919 + si * 977 + variant * 131 + 7);
  const motif = RHYTHMS[Math.floor(r() * RHYTHMS.length)] ?? [0];
  const line = sec.bars.map((numeral, bar) => {
    const steps: (number | null)[] = new Array<number | null>(8).fill(null);
    const rhythm = bar % 2 === 0 ? motif : (RHYTHMS[Math.floor(r() * RHYTHMS.length)] ?? motif);
    const tones = chord(track, numeral).tones.map((n) => n + 12);
    for (const at of rhythm) {
      const base = tones[Math.floor(r() * tones.length)] ?? 69;
      steps[at] = at % 4 === 0 ? base : snapToScale(base + (r() < 0.5 ? 2 : -2), track.key);
    }
    return steps;
  });
  leadCache.set(key, line);
  return line;
}

export const musicIntensity = signal(0);
export const musicEra = signal(0);
const PASSES_PER_TRACK = 2;

let trackIndex = 0;
let section = 0;
let bar = 0;
let step = 0;
let pass = 0;
let totalPasses = 0;
let nextAt = 0;
let playlistEra = 0;

function playlist(era: number): number[] {
  return TRACKS.map((t, i) => (t.eras.includes(era) ? i : -1)).filter((i) => i >= 0);
}

function startMusic() {
  if (!ctx) return;
  nextAt = ctx.currentTime + 0.1;
  setInterval(schedule, 25);
}

function nextTrack() {
  const list = playlist(musicEra.value);
  const at = list.indexOf(trackIndex);
  trackIndex = list[(at + 1) % list.length] ?? 0;
  section = 0;
  pass = 0;
}

function schedule() {
  if (!ctx) return;
  while (nextAt < ctx.currentTime + 0.12) {
    const track = TRACKS[trackIndex] as Track;
    playStep(track, nextAt);
    nextAt += 60 / track.bpm / 2;
    if (++step < 8) continue;
    step = 0;
    if (++bar < (track.sections[section]?.bars.length ?? 0)) continue;
    bar = 0;
    // a new era switches playlist at the next section boundary
    if (musicEra.value !== playlistEra) {
      playlistEra = musicEra.value;
      nextTrack();
      continue;
    }
    section += 1;
    if (section >= track.sections.length) {
      section = 1; // the intro section only plays at the start of a track
      pass += 1;
      totalPasses += 1;
      if (pass >= PASSES_PER_TRACK) nextTrack();
    }
  }
}

function lead(n: number, at: number, dur: number, cutoff: number) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const lp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(midi(n), at);
  osc.detune.setValueAtTime(0, at);
  osc.detune.linearRampToValueAtTime(12, at + dur); // slow drift
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoff, at);
  lp.frequency.exponentialRampToValueAtTime(cutoff * 0.3, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.055, at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(lp).connect(g).connect(musicBus);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function playStep(track: Track, at: number) {
  const sec = track.sections[section];
  if (!sec) return;
  const STEP = 60 / track.bpm / 2;
  const { root, tones } = chord(track, sec.bars[bar] ?? 'i');
  const level = musicIntensity.value;
  const variant = totalPasses % 4;

  const off = sec.bass[step];
  if (off !== null && off !== undefined) {
    const len = sec.bass === LONG ? STEP * 7 : STEP * 0.9;
    tone(midi(root + off), at, len, { type: track.bassWave, gain: 0.08, bus: musicBus });
    tone(midi(root - 12 + off), at, len, { type: 'triangle', gain: 0.11, bus: musicBus });
  }

  if (step === 0) {
    for (const n of tones) {
      tone(midi(n), at, STEP * 8, { type: 'sawtooth', gain: 0.02, attack: STEP * 3, bus: musicBus });
      tone(midi(n) * 1.004, at, STEP * 8, { type: 'sawtooth', gain: 0.016, attack: STEP * 3, bus: musicBus });
    }
  }

  if (level >= 1 && sec.arp !== 'none') {
    const notes = tones.map((n) => n + 12);
    const flip = variant % 2 === 1;
    let n: number | undefined;
    if (sec.arp === 'pulse') n = step % 2 === 0 ? notes[0] : undefined;
    else if (sec.arp === 'run') n = [...notes, (notes[0] ?? 60) + 12][(flip ? 7 - step : step) % 4];
    else n = notes[(sec.arp === 'down') !== flip ? 2 - (step % 3) : step % 3];
    if (n !== undefined) tone(midi(n), at, STEP * 0.6, { type: 'triangle', gain: 0.045, bus: musicBus });
  }

  if (level >= 2 && sec.lead) {
    const n = leadLine(trackIndex, section, variant)[bar]?.[step];
    if (n !== null && n !== undefined) lead(n, at, STEP * 1.8, track.leadCutoff);
  }

  if (level >= 3 && sec.drums > 0) {
    const half = sec.drums === 3;
    if (half ? step === 0 : step % 4 === 0)
      tone(110, at, 0.18, { type: 'sine', gain: 0.25, to: 40, bus: musicBus });
    if (step % 2 === 1) burst(at, 0.04, 0.05, 7000, musicBus);
    if ((sec.drums === 2 && step % 4 === 2) || (half && step === 4)) burst(at, 0.16, 0.16, 1200, musicBus);
    if (sec.drums === 2 && bar === sec.bars.length - 1 && step >= 6) burst(at, 0.08, 0.12, 2000, musicBus);
  }
}
