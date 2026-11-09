import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { NEWS } from '../data/news.ts';
import { audioPrefs, setAudioPrefs } from '../audio/audio.ts';
import { mountScene } from '../scene/scene.ts';
import { RIVALS } from '../data/economy.ts';
import { isFinalEra, rates, rivalCap } from '../sim/sim.ts';
import { dispatch, displayLab, game, headlines, labName, modelPrefix, rivalName } from '../state/store.ts';
import { fmt } from './format.ts';
import { OBJECTIVES, currentObjective } from './objectives.ts';
import { lang, t } from './i18n.ts';
import { Boot, Defeat, Help, RoundClosed, Settings, Victory } from './overlays.tsx';
import { Coach } from './coach.tsx';
import {
  Actions,
  Allocation,
  BenchmarkButton,
  ClickUpgrade,
  GoalBar,
  LabLog,
  Leaderboard,
  ObjectiveCard,
} from './panels.tsx';

const VICTORY_KEY = 'asi-rush-victory-seen';

function Scene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current)
      void mountScene(
        host.current,
        () => game.peek(),
        () => labName.peek(),
      );
  }, []);
  return <div class="scene" ref={host} aria-label="Your lab" role="img" />;
}

/** Exchange symbol from a lab's name: the first four letters. */
const ticker = (name: string) =>
  name
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 4);

/** Stock-style quote for a lab: capability as the price, 5-minute change as the move. */
function Quote(p: { sym: string; now: number; then: number }) {
  const change = p.then > 0 ? p.now / p.then - 1 : 0;
  const up = change >= 0;
  return (
    <span class={`quote ${up ? 'up' : 'down'}`}>
      <b>{p.sym}</b> {fmt(p.now)} {up ? '▲' : '▼'} {Math.abs(change * 100).toFixed(1)}%
    </span>
  );
}

function Newswire() {
  const s = game.value;
  const items = useMemo(() => {
    const pool = [...(NEWS[lang.value][game.value.era] ?? [])].sort(() => Math.random() - 0.5).slice(0, 8);
    return [...headlines.value, ...pool];
  }, [headlines.value, lang.value, game.value.era]);
  const me = s.capability.toNumber();
  const myRate = rates(s).capPerSec.toNumber();
  const quotes = [
    <Quote key="me" sym={modelPrefix()} now={me} then={Math.max(0, me - myRate * 300)} />,
    ...RIVALS.map((r) => (
      <Quote
        key={r.id}
        sym={ticker(rivalName(s.era, r.id))}
        now={rivalCap(r, s.time)}
        then={rivalCap(r, Math.max(0, s.time - 300))}
      />
    )),
  ];
  // interleave: a headline, then the board of quotes, then the next headline...
  const strip = items.flatMap((h, i) => [
    <span key={`h${i}`} class="headline">
      {h}
    </span>,
    i % 2 === 1 ? (
      <span key={`q${i}`} class="quotes">
        {quotes}
      </span>
    ) : null,
  ]);
  const chars = items.join('').length + items.length * 40;
  return (
    <div class="newswire" aria-live="off">
      <span class="newswire-label">
        <i class="live-dot" />
        {t('newswire')}
      </span>
      <div class="newswire-track">
        <div
          class="newswire-strip"
          key={items.join('|')}
          style={{ animationDuration: `${Math.max(60, chars * 0.2)}s` }}
        >
          <span class="strip-copy">{strip}</span>
          <span class="strip-copy" aria-hidden="true">
            {strip}
          </span>
        </div>
      </div>
    </div>
  );
}

function Menu(p: { onHelp: () => void; onSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const prefs = audioPrefs.value;
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !(e.target as HTMLElement).closest('.menu') && setOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [open]);
  const item = (label: string, onClick: () => void, state?: boolean) => (
    <button
      class="menu-item"
      role="menuitem"
      onClick={() => {
        onClick();
        if (state === undefined) setOpen(false);
      }}
    >
      <span>{label}</span>
      {state !== undefined && (
        <span class={`menu-state${state ? ' on' : ''}`}>{state ? t('on') : t('off')}</span>
      )}
    </button>
  );
  return (
    <div class="menu">
      <button class="icon-btn" aria-label={t('settings')} aria-expanded={open} onClick={() => setOpen(!open)}>
        ☰
      </button>
      {open && (
        <div class="menu-pop" role="menu">
          {item(t('music'), () => setAudioPrefs({ music: !prefs.music }), prefs.music)}
          {item(t('sound'), () => setAudioPrefs({ sfx: !prefs.sfx }), prefs.sfx)}
          {item(t('fullscreen'), toggleFullscreen)}
          {item(t('help'), p.onHelp)}
          {item(t('settings'), p.onSettings)}
        </div>
      )}
    </div>
  );
}

function Header(p: { onHelp: () => void; onSettings: () => void }) {
  return (
    <header class="top hero">
      <div class="brand">
        <span class="logo small">
          ASI<span>RUSH</span>
        </span>
        <span class="tagline">{t('heroTagline')}</span>
      </div>
      <div class="hero-right">
        <span class="lab-name">{displayLab()}</span>
        <Menu onHelp={p.onHelp} onSettings={p.onSettings} />
      </div>
    </header>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function readSeen(): boolean {
  try {
    return localStorage.getItem(VICTORY_KEY) === '1';
  } catch {
    return false;
  }
}

export function App() {
  const [booted, setBooted] = useState(false);
  const [modal, setModal] = useState<'help' | 'settings' | null>(null);
  const [victorySeen, setVictorySeen] = useState(readSeen);
  const s = game.value;
  const won = s.outcome === 'won';
  const lost = s.outcome === 'lost' || s.outcome === 'doom';
  const roundModal = s.roundClosed && !isFinalEra(s) && !s.outcome;
  const tutorial = currentObjective(s) < OBJECTIVES.length;

  // Space runs a benchmark (desktop shortcut)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (!booted || modal || e.code !== 'Space' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')
        return;
      e.preventDefault();
      if (!e.repeat) dispatch({ type: 'benchmark' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [booted, modal]);

  const closeVictory = () => {
    setVictorySeen(true);
    try {
      localStorage.setItem(VICTORY_KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <>
      <div class="app">
        <Header onHelp={() => setModal('help')} onSettings={() => setModal('settings')} />
        <Newswire />
        <main class="layout">
          <aside class="rail rail-left">
            <Leaderboard />
            <LabLog />
          </aside>
          <section class="stage">
            <GoalBar />
            <div class="scene-frame" data-coach="pdoom">
              <Scene />
              {tutorial && <ObjectiveCard />}
            </div>
          </section>
          <aside class="rail rail-right">
            <div class="actions">
              <Actions />
            </div>
            <div class="deck">
              <BenchmarkButton />
              <ClickUpgrade />
              <Allocation />
            </div>
          </aside>
        </main>
      </div>
      {booted && <Coach paused={modal !== null || (won && !victorySeen) || lost || roundModal} />}
      {!booted && <Boot onDone={() => setBooted(true)} />}
      {booted && modal === 'help' && <Help onClose={() => setModal(null)} />}
      {booted && modal === 'settings' && <Settings onClose={() => setModal(null)} />}
      {booted && won && !victorySeen && <Victory onClose={closeVictory} />}
      {booted && roundModal && <RoundClosed />}
      {booted && lost && <Defeat />}
    </>
  );
}
