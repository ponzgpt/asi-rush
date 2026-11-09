import { useEffect, useMemo, useState } from 'preact/hooks';
import { ERAS, MODELS, RIVALS } from '../data/economy.ts';
import { audioPrefs, setAudioPrefs, titleMusic, unlockAudio } from '../audio/audio.ts';
import { garageStill } from '../scene/garage.ts';
import { pDoom, playerRank } from '../sim/sim.ts';
import { dispatch, displayLab, retryEra, saveEraStartNow } from '../state/store.ts';
import {
  exportSave,
  game,
  hasStarted,
  labName,
  loadSave,
  pushLog,
  resetGame,
  save,
  setLabName,
  startLoop,
} from '../state/store.ts';
import { fmt, fmtClock, fmtInt, fmtPct } from './format.ts';
import { lang, setLang, t, tk, type Key } from './i18n.ts';

const GAME_URL = 'https://ponzgpt.github.io/asi-rush/';

export function Modal(p: {
  onClose: () => void;
  children: preact.ComponentChildren;
  wide?: boolean;
  label: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && p.onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p.onClose]);
  return (
    <div class="overlay" onClick={(e) => e.target === e.currentTarget && p.onClose()}>
      <div class={`modal${p.wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={p.label}>
        <button class="close" aria-label={t('close')} onClick={p.onClose}>
          ×
        </button>
        {p.children}
      </div>
    </div>
  );
}

// --- boot + briefing -----------------------------------------------------

const BIOS = [
  'GARAGE-BIOS (C) 1986  v1.02',
  'MEMORY TEST ........ 640K OK',
  'MATH COPROCESSOR ... DETECTED',
  'FUSE ............... 50 kW (PROBABLY)',
  'LOADING ASI_RUSH.EXE',
];

type Phase = 'title' | 'bios' | 'brief';

export function Boot(p: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('title');
  const [lines, setLines] = useState(0);
  const [name, setName] = useState(labName.value);
  const returning = hasStarted();
  const art = useMemo(() => garageStill(), []);

  // title -> (first key or click) -> BIOS lines -> briefing or "back to the lab"
  const press = () => {
    if (phase !== 'title') return;
    unlockAudio();
    titleMusic.value = true;
    if (window.matchMedia('(pointer: fine)').matches && !document.fullscreenElement)
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
    setPhase('bios');
  };

  useEffect(() => {
    if (phase !== 'title') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      press();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    if (phase !== 'bios') return;
    if (lines >= BIOS.length) {
      const id = setTimeout(() => setPhase('brief'), 350);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => setLines((n) => n + 1), lines === 0 ? 200 : 150);
    return () => clearTimeout(id);
  }, [phase, lines]);

  const go = () => {
    titleMusic.value = false;
    startLoop();
    if (!returning || name !== labName.value) setLabName(name);
    if (!returning) saveEraStartNow();
    p.onDone();
  };

  useEffect(() => {
    if (phase !== 'brief' || !returning) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && go();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div class={`splash phase-${phase}`} onClick={press} style={{ '--art': `url(${art})` }}>
      <div class="splash-art" aria-hidden="true" />
      <div class="splash-shade" aria-hidden="true" />
      {phase === 'title' && (
        <div class="splash-title">
          <h1 class="logo">
            ASI<span>RUSH</span>
          </h1>
          <p class="splash-tagline">{t('heroTagline')}</p>
          <p class="splash-press">{t('pressStart')}</p>
          <p class="splash-credit">{t('titleCredit')}</p>
          <div class="splash-lang" onClick={(e) => e.stopPropagation()}>
            <LangSwitch />
          </div>
        </div>
      )}
      {phase !== 'title' && (
        <div class="splash-panel">
          <pre class="bios">
            {BIOS.slice(0, lines).join('\n')}
            {phase === 'bios' && <span class="caret">█</span>}
          </pre>
          {phase === 'brief' && (
            <div class="briefing">
              <div class="tag">
                {returning
                  ? `${tk(`era.${game.value.era}`)} · ${labName.value || t('labNameDefault')}`
                  : t('briefingTag')}
              </div>
              {returning ? (
                <>
                  <button class="key key-primary key-big" onClick={go}>
                    {t('continue')}
                  </button>
                  <p class="blink dim">{t('bootPress')}</p>
                </>
              ) : (
                <>
                  <p class="lead">{t('briefing1')}</p>
                  <p class="lead">{t('briefing2')}</p>
                  <ol class="how">
                    {(['how1', 'how2', 'how3', 'how4'] as Key[]).map((k, i) => (
                      <li key={k}>
                        <b>{i + 1}</b>
                        {t(k)}
                      </li>
                    ))}
                  </ol>
                  <p class="goal-line">{t('briefingGoal')}</p>
                  <form
                    class="lab-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      go();
                    }}
                  >
                    <label>
                      {t('labNameLabel')}
                      <input
                        value={name}
                        maxLength={32}
                        placeholder={t('labNameDefault')}
                        onInput={(e) => setName(e.currentTarget.value)}
                      />
                    </label>
                    <button class="key key-primary key-big" type="submit">
                      {t('start')}
                    </button>
                  </form>
                  <p class="dim small">{t('briefingFoot')}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LangSwitch() {
  return (
    <div class="seg-group">
      {(['en', 'es'] as const).map((l) => (
        <button key={l} class={`seg${lang.value === l ? ' active' : ''}`} onClick={() => setLang(l)}>
          {l === 'en' ? 'English' : 'Español'}
        </button>
      ))}
    </div>
  );
}

// --- help ----------------------------------------------------------------

export function Help(p: { onClose: () => void }) {
  return (
    <Modal onClose={p.onClose} wide label={t('help')}>
      <div class="modal-tag">{t('help')}</div>
      <h2>{t('helpWhat')}</h2>
      <p>{t('helpWhatBody')}</p>
      <h2>{t('helpLoop')}</h2>
      <ol class="how">
        {(['how1', 'how2', 'how3', 'how4'] as Key[]).map((k, i) => (
          <li key={k}>
            <b>{i + 1}</b>
            {t(k)}
          </li>
        ))}
      </ol>
      <h2>{t('helpWin')}</h2>
      <p>{t('helpWinBody')}</p>
      <h2>{t('helpGlossary')}</h2>
      <ul class="glossary">
        {(['g.flops', 'g.split', 'g.scaling', 'g.power', 'g.models', 'g.pdoom', 'g.offline'] as Key[]).map(
          (k) => {
            const [term, ...rest] = t(k).split(' — ');
            return (
              <li key={k}>
                <b>{term}</b> {rest.join(' — ')}
              </li>
            );
          },
        )}
      </ul>
    </Modal>
  );
}

// --- settings ------------------------------------------------------------

export function Settings(p: { onClose: () => void }) {
  const [text, setText] = useState('');
  const prefs = audioPrefs.value;
  return (
    <Modal onClose={p.onClose} label={t('settings')}>
      <div class="modal-tag">{t('settings')}</div>
      <div class="setting">
        <span>{t('language')}</span>
        <LangSwitch />
      </div>
      <div class="setting">
        <span>{t('sound')}</span>
        <Toggle on={prefs.sfx} onChange={(v) => setAudioPrefs({ sfx: v })} />
      </div>
      <div class="setting">
        <span>{t('music')}</span>
        <Toggle on={prefs.music} onChange={(v) => setAudioPrefs({ music: v })} />
      </div>
      <h2>{t('save')}</h2>
      <textarea
        rows={4}
        placeholder={t('importPrompt')}
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
      />
      <div class="row-buttons">
        <button class="key" onClick={() => (save(), pushLog(t('saved')))}>
          {t('saveNow')}
        </button>
        <button class="key" onClick={() => setText(exportSave())}>
          {t('export')}
        </button>
        <button
          class="key"
          onClick={() => (loadSave(text) ? pushLog(t('imported'), 'good') : pushLog(t('importBad'), 'warn'))}
        >
          {t('import')}
        </button>
        <button
          class="key key-danger"
          onClick={() => confirm(t('resetConfirm')) && (resetGame(), p.onClose())}
        >
          {t('reset')}
        </button>
      </div>
    </Modal>
  );
}

function Toggle(p: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div class="seg-group">
      <button class={`seg${p.on ? ' active' : ''}`} onClick={() => p.onChange(true)}>
        {t('on')}
      </button>
      <button class={`seg${!p.on ? ' active' : ''}`} onClick={() => p.onChange(false)}>
        {t('off')}
      </button>
    </div>
  );
}

// --- round closed --------------------------------------------------------

export function RoundClosed() {
  const s = game.value;
  const next = s.era + 1;
  return (
    <Modal onClose={() => undefined} label={tk(`roundTitle.${s.era}`)}>
      <div class="victory">
        <div class="modal-tag tone-ok">{t('roundTag')}</div>
        <h2 class="victory-title">{tk(`roundTitle.${s.era}`)}</h2>
        <p>{tk(`roundLead.${s.era}`, { n: fmtInt(ERAS[s.era]?.goal ?? 0) })}</p>
        <p class="era-next">{tk(`roundNext.${next}`)}</p>
        <div class="row-buttons">
          <button class="key key-primary key-big" onClick={() => dispatch({ type: 'advanceEra' })}>
            {t('moveOn', { era: tk(`era.${next}`) })}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- defeat --------------------------------------------------------------

export function Defeat() {
  const s = game.value;
  const doom = s.outcome === 'doom';
  const lab = tk(`rival.${s.lostTo ?? ''}`);
  return (
    <Modal onClose={() => undefined} label={doom ? t('doomTitle') : t('lostTag')}>
      <div class="victory defeat">
        <div class="modal-tag">{doom ? t('doomTag') : t('lostTag')}</div>
        <h2 class="victory-title">
          {doom ? t('doomTitle') : t('lostTitle', { lab, round: tk(`round.${s.era}`) })}
        </h2>
        <p>{doom ? t('doomLead') : t('lostLead')}</p>
        <p class="dim small">{t('lostHint')}</p>
        <div class="row-buttons">
          <button class="key key-primary" onClick={() => retryEra()}>
            {t('retryEra')}
          </button>
          <button class="key" onClick={() => confirm(t('resetConfirm')) && resetGame()}>
            {t('newGame')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// --- victory -------------------------------------------------------------

export function Victory(p: { onClose: () => void }) {
  const s = game.value;
  const [copied, setCopied] = useState(false);
  const time = fmtClock(s.roundsClosedAt[s.roundsClosedAt.length - 1] ?? s.time);
  const rank = playerRank(s);
  const pd = fmtPct(pDoom(s));
  const text = t('shareText', { t: time, p: pd });
  const share = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(GAME_URL)}`;
  const stats: [Key, string][] = [
    ['statTime', time],
    ['statRank', `#${rank} / ${RIVALS.length + 1}`],
    ['statModels', `${s.modelsShipped} / ${MODELS.length}`],
    ['statPapers', String(s.research.length)],
    ['statPdoom', pd],
    ['statFlops', fmt(s.flopsSpentTraining)],
  ];
  return (
    <Modal onClose={p.onClose} label={t('victoryTitle')}>
      <div class="victory">
        <div class="modal-tag tone-ok">{t('victoryTag')}</div>
        <h2 class="victory-title">{t('victoryTitle')}</h2>
        <p>{t('victoryLead', { lab: displayLab() })}</p>
        <p class="dim small">{t('victoryDoom', { p: pd })}</p>
        <dl class="victory-stats">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{t(k)}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div class="row-buttons">
          <a class="key key-primary" href={share} target="_blank" rel="noopener noreferrer">
            {t('shareX')}
          </a>
          <button
            class="key"
            onClick={() => {
              void navigator.clipboard?.writeText(`${text} ${GAME_URL}`).then(() => setCopied(true));
            }}
          >
            {copied ? t('copied') : t('copyResult')}
          </button>
          <button class="key" onClick={p.onClose}>
            {t('keepPlaying')}
          </button>
        </div>
      </div>
    </Modal>
  );
}
