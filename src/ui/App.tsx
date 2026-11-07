import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { NEWS } from '../data/news.ts';
import { audioPrefs, setAudioPrefs } from '../audio/audio.ts';
import { mountScene } from '../scene/scene.ts';
import { playerRank } from '../sim/sim.ts';
import { dispatch, displayLab, game, headlines, labName } from '../state/store.ts';
import { fmtClock } from './format.ts';
import { lang, t } from './i18n.ts';
import { Boot, Help, Settings, Victory } from './overlays.tsx';
import { Allocation, BenchmarkButton, GoalBar, LabLog, ObjectiveCard, Shop, Stats } from './panels.tsx';

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

function Newswire() {
  const items = useMemo(() => {
    const pool = [...NEWS[lang.value]].sort(() => Math.random() - 0.5).slice(0, 8);
    return [...headlines.value, ...pool];
  }, [headlines.value, lang.value]);
  const text = items.join('   ◆   ');
  return (
    <div class="newswire" aria-live="off">
      <span class="newswire-label">{t('newswire')}</span>
      <div class="newswire-track">
        <div
          class="newswire-strip"
          key={text}
          style={{ animationDuration: `${Math.max(40, text.length / 7)}s` }}
        >
          <span>{text}</span>
          <span aria-hidden="true">{text}</span>
        </div>
      </div>
    </div>
  );
}

function IconButton(p: {
  label: string;
  onClick: () => void;
  children: preact.ComponentChildren;
  off?: boolean;
}) {
  return (
    <button class={`icon-btn${p.off ? ' off' : ''}`} aria-label={p.label} title={p.label} onClick={p.onClick}>
      {p.children}
    </button>
  );
}

function Header(p: { onHelp: () => void; onSettings: () => void }) {
  const s = game.value;
  const prefs = audioPrefs.value;
  return (
    <header class="top">
      <div class="brand">
        <span class="logo small">
          ASI<span>RUSH</span>
        </span>
        <span class="era">
          {t('era')} · <b>{displayLab()}</b>
        </span>
      </div>
      <GoalBar />
      <div class="top-meta">
        <span class="clock" title="T+">
          T+{fmtClock(s.time)}
        </span>
        <span class="rank">#{playerRank(s)}</span>
        <IconButton
          label={t('music')}
          off={!prefs.music}
          onClick={() => setAudioPrefs({ music: !prefs.music })}
        >
          ♫
        </IconButton>
        <IconButton label={t('sound')} off={!prefs.sfx} onClick={() => setAudioPrefs({ sfx: !prefs.sfx })}>
          ◖
        </IconButton>
        <IconButton label={t('help')} onClick={p.onHelp}>
          ?
        </IconButton>
        <IconButton label={t('settings')} onClick={p.onSettings}>
          ⚙
        </IconButton>
      </div>
    </header>
  );
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
  const won = game.value.eraCompleteAt !== null;

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
        <main class="layout">
          <div class="col-main">
            <div class="scene-frame">
              <Scene />
            </div>
            <Stats />
            <LabLog />
          </div>
          <aside class="col-side">
            <ObjectiveCard />
            <BenchmarkButton />
            <Allocation />
            <Shop />
          </aside>
        </main>
        <Newswire />
      </div>
      {!booted && <Boot onDone={() => setBooted(true)} />}
      {booted && modal === 'help' && <Help onClose={() => setModal(null)} />}
      {booted && modal === 'settings' && <Settings onClose={() => setModal(null)} />}
      {booted && won && !victorySeen && <Victory onClose={closeVictory} />}
    </>
  );
}
