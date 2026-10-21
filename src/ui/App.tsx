import { useEffect, useRef, useState } from 'preact/hooks';
import { BUILDINGS, BUILDING_ORDER, ECONOMY, MILESTONES } from '../data/economy.ts';
import { NEWS } from '../data/news.ts';
import { mountScene } from '../scene/scene.ts';
import { buildingCost, fuseCost, powerCapMW, powerDemandMW, rates, risk, throttle } from '../sim/sim.ts';
import { dispatch, exportSave, game, loadSave, log, pushLog, resetGame, save } from '../state/store.ts';
import { fmt } from './format.ts';
import { lang, setLang, t } from './i18n.ts';

function Resources() {
  const s = game.value;
  const r = rates(s);
  const hot = throttle(s) < 1;
  return (
    <section class="panel resources">
      <Row label={t('cash')} value={`$${fmt(s.cash)}`} sub={`+$${fmt(r.cashPerSec)}/s`} />
      <Row label={t('compute')} value={`${fmt(r.flops)} FLOP/s`} sub={hot ? t('throttled') : ''} hot={hot} />
      <Row
        label={t('power')}
        value={`${powerDemandMW(s).toFixed(3)} / ${powerCapMW(s).toFixed(3)} MW`}
        sub={hot ? `${Math.round(throttle(s) * 100)}%` : ''}
        hot={hot}
      />
      <Row
        label={t('capability')}
        value={`${fmt(s.capability)} / ${fmt(MILESTONES.eraGoalCap)}`}
        sub={`+${fmt(r.capPerSec, 2)}/s`}
      />
      <Row label={t('risk')} value={fmt(risk(s))} sub="alignment: 0" />
    </section>
  );
}

function Row(p: { label: string; value: string; sub: string; hot?: boolean }) {
  return (
    <div class={`row${p.hot ? ' hot' : ''}`}>
      <span class="label">{p.label}</span>
      <span class="value">{p.value}</span>
      <span class="sub">{p.sub}</span>
    </div>
  );
}

function Shop() {
  const s = game.value;
  return (
    <section class="panel">
      <button class="big" onClick={() => dispatch({ type: 'benchmark' })}>
        {t('benchmark')} <small>{t('benchmarkHint', { n: ECONOMY.benchmarkCash })}</small>
      </button>
      <h2>{t('buildings')}</h2>
      {BUILDING_ORDER.map((id) => {
        const cost = buildingCost(id, s.owned[id]);
        const b = BUILDINGS[id];
        return (
          <button
            key={id}
            class="buy"
            disabled={s.cash.lt(cost)}
            onClick={() => dispatch({ type: 'buy', building: id })}
          >
            <span>
              {t(id)} <b>×{s.owned[id]}</b>
            </span>
            <span class="meta">
              {fmt(b.flops)} FLOP/s · {(b.powerMW * 1000).toFixed(0)} kW
            </span>
            <span class="cost">${fmt(cost)}</span>
          </button>
        );
      })}
      <button
        class="buy"
        disabled={s.cash.lt(fuseCost(s.fuseLevel))}
        onClick={() => dispatch({ type: 'buyFuse' })}
      >
        <span>{t('fuse')}</span>
        <span class="meta">{t('fuseHint', { n: s.fuseLevel })}</span>
        <span class="cost">${fmt(fuseCost(s.fuseLevel))}</span>
      </button>
      <h2>{t('allocation')}</h2>
      <label class="slider">
        <span>
          {t('inference')} {Math.round((1 - s.trainShare) * 100)}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(s.trainShare * 100)}
          onInput={(e) => dispatch({ type: 'setTrainShare', share: Number(e.currentTarget.value) / 100 })}
        />
        <span>
          {t('training')} {Math.round(s.trainShare * 100)}%
        </span>
      </label>
    </section>
  );
}

function Scene() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (host.current) void mountScene(host.current, () => game.peek());
  }, []);
  return <div class="scene" ref={host} />;
}

function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => n + 1), 14000);
    return () => clearInterval(id);
  }, []);
  const lines = NEWS[lang.value].length ? NEWS[lang.value] : NEWS.en;
  return (
    <div class="ticker">
      <span key={i}>{lines[i % lines.length]}</span>
    </div>
  );
}

function Log() {
  return (
    <section class="panel log">
      <h2>{t('log')}</h2>
      <ul>
        {log.value.map((line, i) => (
          <li key={log.value.length - i}>&gt; {line}</li>
        ))}
      </ul>
    </section>
  );
}

function SavePanel() {
  const [text, setText] = useState('');
  return (
    <section class="panel">
      <h2>{t('save')}</h2>
      <textarea
        placeholder={t('importPrompt')}
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
        rows={3}
      />
      <div class="buttons">
        <button onClick={() => (save(), pushLog(t('saved')))}>{t('save')}</button>
        <button onClick={() => setText(exportSave())}>{t('export')}</button>
        <button onClick={() => pushLog(loadSave(text) ? t('imported') : t('importBad'))}>
          {t('import')}
        </button>
        <button onClick={() => confirm(t('resetConfirm')) && resetGame()}>{t('reset')}</button>
        <button onClick={() => setLang(lang.value === 'en' ? 'es' : 'en')}>
          {lang.value === 'en' ? 'ES' : 'EN'}
        </button>
      </div>
    </section>
  );
}

export function App() {
  const done = game.value.eraCompleteAt !== null;
  return (
    <main>
      <header>
        <h1>{t('title')}</h1>
        <span>{t('subtitle')}</span>
      </header>
      {done && <div class="banner">{t('eraComplete')}</div>}
      <div class="layout">
        <div class="left">
          <Scene />
          <Ticker />
          <Resources />
        </div>
        <div class="right">
          <Shop />
          <Log />
          <SavePanel />
        </div>
      </div>
    </main>
  );
}
