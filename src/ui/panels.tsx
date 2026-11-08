import { useEffect, useRef, useState } from 'preact/hooks';
import Decimal from 'break_eternity.js';
import {
  BUILDINGS,
  BUILDING_ORDER,
  CLICK_UPGRADES,
  ERAS,
  MODELS,
  RESEARCH,
  RIVALS,
} from '../data/economy.ts';
import {
  buildingUnlocked,
  bulkCost,
  canShip,
  clickValue,
  eraOf,
  fuseCost,
  leader,
  maxAffordable,
  nextClickUpgrade,
  nextModel,
  pDoom,
  playerRank,
  powerCapMW,
  powerDemandMW,
  rates,
  researchAvailable,
  rivalCap,
  rivalEta,
  throttle,
  trust,
  type BuyCount,
  type State,
} from '../sim/sim.ts';
import { icons } from '../scene/sprites.ts';
import { dispatch, displayLab, game, log, modelName } from '../state/store.ts';
import { fmt, fmtClock, fmtDuration, fmtInt, fmtPct, fmtPower } from './format.ts';
import { t, tk, type Key } from './i18n.ts';
import { OBJECTIVES, currentObjective } from './objectives.ts';

// --- small pieces --------------------------------------------------------

export function Bar(p: { value: number; tone: string; label?: string; marker?: number }) {
  const v = Math.max(0, Math.min(1, p.value));
  return (
    <div class="bar" role="progressbar" aria-valuenow={Math.round(v * 100)} aria-label={p.label}>
      <div class="bar-fill" style={{ width: `${v * 100}%`, background: `var(--${p.tone})` }} />
      {p.marker !== undefined && (
        <i class="bar-marker" style={{ left: `${Math.max(0, Math.min(1, p.marker)) * 100}%` }} />
      )}
    </div>
  );
}

/** "in 1m 20s" until cash covers cost, or null when affordable. */
function eta(cost: Decimal, s: State): string | null {
  if (s.cash.gte(cost)) return null;
  const perSec = rates(s).cashPerSec;
  if (perSec.lte(0)) return '—';
  return t('eta', { t: fmtDuration(cost.sub(s.cash).div(perSec).toNumber()) });
}

/** Seconds of training until Capability reaches target (0 if already there), null when training is stopped. */
function capEta(target: number, s: State): number | null {
  const gap = target - s.capability.toNumber();
  if (gap <= 0) return 0;
  const perSec = rates(s).capPerSec.toNumber();
  return perSec > 0 ? gap / perSec : null;
}

function Chip(p: { tone: string; children: preact.ComponentChildren }) {
  return <span class={`chip tone-${p.tone}`}>{p.children}</span>;
}

function Section(p: {
  title: string;
  children: preact.ComponentChildren;
  extra?: preact.ComponentChildren;
  class?: string;
}) {
  return (
    <section class={`window ${p.class ?? ''}`}>
      <div class="window-title">
        <span>{p.title}</span>
        {p.extra}
      </div>
      <div class="window-body">{p.children}</div>
    </section>
  );
}

// --- header: funding round + countdown -----------------------------------

export function GoalBar() {
  const s = game.value;
  const era = eraOf(s);
  const cap = s.capability.toNumber();
  const round = tk(`round.${s.era}`);
  const top = leader(s.time);
  const rival = s.roundClosed || s.outcome ? null : rivalEta(s.time, era.goal);
  const mine = capEta(era.goal, s);
  const losing = rival !== null && rival < 600 && (mine === null || rival < mine);
  const lab = tk(`rival.${top.rival.id}`);
  return (
    <div class="goal" data-coach="goal" title={t('roundHint', { n: fmtInt(era.goal), round })}>
      <div class="goal-row">
        <span class="goal-label">
          {tk(`era.${s.era}`)} · <b>{round}</b>
        </span>
        <span class="goal-num">
          {fmt(cap)} <span class="dim">/ {era.goal < 1e6 ? fmtInt(era.goal) : fmt(era.goal)}</span>
        </span>
      </div>
      <Bar value={cap / era.goal} tone="cap" label={round} marker={top.cap / era.goal} />
      {rival !== null && (
        <div class={`countdown${losing ? ' losing' : ''}`}>
          <span>{rival === 0 ? t('deadlineNow', { lab }) : t('deadline', { lab, t: fmtClock(rival) })}</span>
          <span class="dim">
            {mine === null ? t('youStalled') : mine < 36_000 ? t('youEta', { t: fmtClock(mine) }) : ''}
          </span>
        </div>
      )}
    </div>
  );
}

// --- resources -----------------------------------------------------------

export function Stats() {
  const s = game.value;
  const r = rates(s);
  const th = throttle(s);
  const hot = th < 1;
  const demand = powerDemandMW(s);
  const cap = powerCapMW(s);
  const pd = pDoom(s);
  return (
    <section class="stats" aria-label="Resources">
      <Stat
        tone="cash"
        label={t('runway')}
        tip={t('runwayTip')}
        value={`$${fmt(s.cash)}`}
        sub={`+$${fmt(r.cashPerSec)}${t('perSec')}`}
      />
      <Stat
        tone="compute"
        label={t('compute')}
        tip={t('computeTip')}
        value={fmt(r.flops)}
        unit="FLOP/s"
        sub={hot ? `${t('throttled')} ${fmtPct(th)}` : `${fmtPct(s.trainShare)} → ${t('training')}`}
        warn={hot}
      />
      <Stat
        tone="power"
        label={t('power')}
        tip={t('powerTip')}
        value={fmtPower(demand)}
        sub={`/ ${fmtPower(cap)}`}
        warn={hot}
        meter={demand / cap}
      />
      <Stat
        tone="cap"
        label={t('capability')}
        tip={t('capabilityTip')}
        value={fmt(s.capability)}
        sub={`+${fmt(r.capPerSec, 2)}${t('perSec')}`}
      />
      <Stat
        tone="doom"
        coach="pdoom"
        label={t('pdoom')}
        tip={t('pdoomTip')}
        value={fmtPct(pd)}
        meter={pd}
        sub={t('trust', { n: trust(s).toFixed(2) })}
        warn={pd > 0.5}
      />
    </section>
  );
}

function Stat(p: {
  tone: string;
  label: string;
  tip: string;
  value: string;
  unit?: string;
  sub?: string;
  warn?: boolean;
  meter?: number;
  coach?: string;
}) {
  return (
    <div class={`stat tone-${p.tone}${p.warn ? ' warn' : ''}`} title={p.tip} data-coach={p.coach}>
      <div class="stat-label">
        <i class="dot" />
        {p.label}
      </div>
      <div class="stat-value">
        {p.value}
        {p.unit && <small> {p.unit}</small>}
      </div>
      {p.meter !== undefined && <Bar value={p.meter} tone={p.warn ? 'doom' : p.tone} />}
      {p.sub && <div class="stat-sub">{p.sub}</div>}
    </div>
  );
}

// --- tutorial objective (shown only while the tutorial runs) ---------------

export function ObjectiveCard() {
  const s = game.value;
  const i = currentObjective(s);
  const o = OBJECTIVES[i];
  if (!o) return null;
  return (
    <div class="objective" key={i}>
      <div class="objective-head">
        <span>{t('objective')}</span>
        <span class="dim">
          {i + 1}/{OBJECTIVES.length}
        </span>
      </div>
      <p>{t(o.key, { n: fmtInt(ERAS[0]?.goal ?? 0) })}</p>
      {o.progress && <Bar value={o.progress(s)} tone="ok" />}
    </div>
  );
}

// --- deck: benchmark + click upgrades + allocation ------------------------

export function BenchmarkButton() {
  const s = game.value;
  const value = clickValue(s);
  const [pops, setPops] = useState<{ id: number; x: number; y: number; v: string }[]>([]);
  const click = (e: MouseEvent) => {
    const v = fmt(clickValue(game.peek()));
    dispatch({ type: 'benchmark' });
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const id = performance.now();
    const x = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const y = e.clientY ? e.clientY - rect.top : rect.height / 2;
    setPops((p) => [...p.slice(-8), { id, x, y, v }]);
    setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 800);
  };
  return (
    <button class="key key-big bench" data-coach="benchmark" onClick={click}>
      <span class="key-title">{t('benchmark')}</span>
      <span class="key-sub">{t('benchmarkSub', { n: fmt(value) })}</span>
      {pops.map((p) => (
        <span key={p.id} class="pop" style={{ left: `${p.x}px`, top: `${p.y}px` }}>
          +${p.v}
        </span>
      ))}
    </button>
  );
}

export function ClickUpgrade() {
  const s = game.value;
  const u = nextClickUpgrade(s);
  if (!u) return <div class="clickup done dim small">{t('clickDone')}</div>;
  const ok = s.cash.gte(u.cost);
  return (
    <button
      class="clickup"
      data-coach="clickup"
      disabled={!ok}
      onClick={() => dispatch({ type: 'clickUpgrade' })}
    >
      <span class="clickup-name">
        {t('clickUpgrade')}: <b>{tk(`c.${u.id}`)}</b>
      </span>
      <span class="clickup-eff">
        {u.mult ? t('clickMult', { n: u.mult }) : t('clickPct', { n: Math.round((u.revenuePct ?? 0) * 100) })}
      </span>
      <span class="clickup-cost">{ok ? `$${fmt(u.cost)}` : (eta(new Decimal(u.cost), s) ?? '')}</span>
      <span class="clickup-pips">
        {CLICK_UPGRADES.map((c, i) => (
          <i key={c.id} class={i < s.clickUpgrades ? 'on' : ''} />
        ))}
      </span>
    </button>
  );
}

const PRESETS: [Key, number][] = [
  ['presetCash', 0.2],
  ['presetBalanced', 0.5],
  ['presetTrain', 0.8],
];

export function Allocation() {
  const s = game.value;
  const r = rates(s);
  const pct = Math.round(s.trainShare * 100);
  const next = nextModel(s);
  const secs = next ? capEta(next.cap, s) : null;
  let nextLine = '';
  if (next && r.flops > 0) {
    const model = modelName(s.modelsShipped);
    nextLine =
      secs === 0
        ? t('nextReleaseReady', { model })
        : t('nextRelease', { model, t: secs === null ? '∞' : fmtDuration(secs) });
  }
  return (
    <div class="alloc" data-coach="alloc">
      <div class="alloc-top">
        <span class="alloc-title">{t('allocation')}</span>
        <span class="dim small">{t('allocTotal', { n: fmt(r.flops) })}</span>
      </div>
      <div class="alloc-sides">
        <div class="side tone-cash">
          <div class="side-head">
            {t('serving')} <b>{100 - pct}%</b>
          </div>
          <div class="side-rate">+${fmt(r.cashPerSec)}/s</div>
          <div class="side-what">{t('servingWhat')}</div>
        </div>
        <div class="side tone-cap right">
          <div class="side-head">
            {t('training')} <b>{pct}%</b>
          </div>
          <div class="side-rate">+{fmt(r.capPerSec, 2)} cap/s</div>
          <div class="side-what">{t('trainingWhat')}</div>
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={pct}
        aria-label={t('allocation')}
        style={{ '--pct': `${pct}%` }}
        onInput={(e) => dispatch({ type: 'setTrainShare', share: Number(e.currentTarget.value) / 100 })}
      />
      <div class="alloc-foot">
        <div class="seg-group">
          {PRESETS.map(([k, v]) => (
            <button
              key={k}
              class={`seg seg-sm${Math.abs(s.trainShare - v) < 0.01 ? ' active' : ''}`}
              onClick={() => dispatch({ type: 'setTrainShare', share: v })}
            >
              {t(k)}
            </button>
          ))}
        </div>
        {nextLine && <span class={`next-line${secs === 0 ? ' ready' : ''}`}>{nextLine}</span>}
      </div>
    </div>
  );
}

// --- action column: release, research, hardware --------------------------

export function Actions() {
  return (
    <>
      <Release />
      <ResearchSection />
      <HardwareSection />
    </>
  );
}

function Release() {
  const s = game.value;
  const ic = icons();
  const i = s.modelsShipped;
  const next = nextModel(s);
  const eraModels = MODELS.filter((m) => m.era === s.era).length;
  const shippedInEra = MODELS.slice(0, i).filter((m) => m.era === s.era).length;
  if (!next) {
    return (
      <Section title={t('secRelease')}>
        <p class="empty">{t('allShipped')}</p>
      </Section>
    );
  }
  const ready = canShip(s);
  const secs = capEta(next.cap, s);
  return (
    <Section title={t('secRelease')} extra={<span class="dim">{`${shippedInEra}/${eraModels}`}</span>}>
      <div class={`model-card${ready ? ' ready' : ''}`}>
        <div class="model-head">
          <img src={ic.model} alt="" class="px-icon" />
          <div class="grow">
            <div class="model-name">{modelName(i)}</div>
            <div class="dim small">{t('params', { n: next.params })}</div>
          </div>
        </div>
        <p class="model-tag">“{tk(`m.${i}`)}”</p>
        <div class="chips">
          <Chip tone="cash">{t('priceUp', { n: next.priceMult, c: fmt(next.hypeCash) })}</Chip>
        </div>
        <Bar value={s.capability.toNumber() / next.cap} tone="cap" />
        <button
          class="key key-primary"
          data-coach="ship"
          disabled={!ready}
          onClick={() => dispatch({ type: 'ship' })}
        >
          <span>{ready ? t('shipIt') : t('shipNeeds', { n: fmt(next.cap) })}</span>
          {!ready && (
            <span class="key-sub">
              {secs !== null
                ? t('etaTraining', { t: fmtDuration(secs) })
                : rates(s).flops > 0
                  ? t('noTraining')
                  : ''}
            </span>
          )}
        </button>
      </div>
    </Section>
  );
}

function effects(r: (typeof RESEARCH)[number]) {
  const out = [];
  if (r.capMult) out.push(<Chip tone="cap">{t('effCap', { n: r.capMult })}</Chip>);
  if (r.cashMult) out.push(<Chip tone="cash">{t('effCash', { n: r.cashMult })}</Chip>);
  if (r.flopsMult) out.push(<Chip tone="compute">{t('effFlops', { n: r.flopsMult })}</Chip>);
  if (r.powerMult)
    out.push(<Chip tone="power">{t('effPower', { n: Math.round((1 - r.powerMult) * 100) })}</Chip>);
  if (r.alignment) out.push(<Chip tone="ok">{t('effAlign')}</Chip>);
  return out;
}

function ResearchSection() {
  const s = game.value;
  const ic = icons();
  const open = researchAvailable(s);
  const next = RESEARCH.find(
    (r) => r.era <= s.era && !s.research.includes(r.id) && s.capability.lt(r.unlockCap),
  );
  const done = RESEARCH.filter((r) => s.research.includes(r.id));
  const nextSecs = next ? capEta(next.unlockCap, s) : null;
  return (
    <Section title={t('secResearch')} extra={<span class="dim">{`${done.length}/${RESEARCH.length}`}</span>}>
      <div class="list">
        {open.map((r, k) => (
          <Item
            key={r.id}
            coach={k === 0 ? 'research' : undefined}
            icon={ic.paper}
            title={tk(`r.${r.id}`)}
            desc={tk(`r.${r.id}.d`)}
            chips={effects(r)}
            price={`$${fmt(r.cost)}`}
            action={t('publish')}
            ok={s.cash.gte(r.cost)}
            eta={eta(new Decimal(r.cost), s)}
            safety={r.alignment !== undefined}
            onBuy={() => dispatch({ type: 'research', id: r.id })}
          />
        ))}
        {open.length === 0 && !next && <p class="empty">{t('researchNone')}</p>}
        {next && (
          <p class="next">
            {t('researchNext', { n: fmt(next.unlockCap) })}
            {nextSecs !== null && nextSecs > 0 && ` · ${t('etaTraining', { t: fmtDuration(nextSecs) })}`}
          </p>
        )}
        {done.length > 0 && (
          <details class="done-list">
            <summary>{t('researchPublished', { n: done.length })}</summary>
            {done.map((r) => (
              <div key={r.id} class="done-row">
                <span>{tk(`r.${r.id}`)}</span>
                <span class="chips">{effects(r)}</span>
              </div>
            ))}
          </details>
        )}
      </div>
    </Section>
  );
}

const COACH_IDS: Record<string, string> = { homePc: 'pc', accelCard: 'card' };

function HardwareSection() {
  const s = game.value;
  const [mode, setMode] = useState<BuyCount>(1);
  const ic = icons();
  // current era first: the newest, biggest machines are what matter now
  const visible = BUILDING_ORDER.filter(
    (id) =>
      buildingUnlocked(id, s) &&
      (s.owned[id] > 0 || s.era > BUILDINGS[id].era || s.cashEarned.gte(BUILDINGS[id].revealAt)),
  ).reverse();
  const nextLocked = BUILDING_ORDER.find((id) => buildingUnlocked(id, s) && !visible.includes(id));
  const nextEra = BUILDING_ORDER.find((id) => !buildingUnlocked(id, s));
  const fuse = fuseCost(s);
  const showFuse = s.fuseLevel > 0 || powerDemandMW(s) > powerCapMW(s) * 0.6;
  return (
    <Section
      title={t('secHardware')}
      extra={
        <span class="seg-group">
          {([1, 10, 'max'] as const).map((m) => (
            <button key={m} class={`seg seg-sm${mode === m ? ' active' : ''}`} onClick={() => setMode(m)}>
              {m === 'max' ? t('buyMax') : `×${m}`}
            </button>
          ))}
        </span>
      }
    >
      <div class="list">
        {showFuse && (
          <Item
            coach="fuse"
            icon={ic.fuse}
            title={tk(`power.${s.era}`)}
            count={s.fuseLevel}
            desc={tk(`power.${s.era}.d`)}
            chips={[<Chip tone="power">{t('powerEffect', { n: s.fuseLevel + 1 })}</Chip>]}
            price={`$${fmt(fuse)}`}
            ok={s.cash.gte(fuse)}
            eta={eta(fuse, s)}
            hot={throttle(s) < 1}
            onBuy={() => dispatch({ type: 'buyFuse' })}
          />
        )}
        {nextLocked && (
          <div class="item locked">
            <div class="item-icon">?</div>
            <div class="item-main">
              <div class="item-title">{t('locked')}</div>
              <div class="item-desc">{t('lockedHint')}</div>
            </div>
          </div>
        )}
        {visible.map((id) => {
          const b = BUILDINGS[id];
          const owned = s.owned[id];
          const n = mode === 'max' ? Math.max(1, maxAffordable(id, owned, s.cash)) : mode;
          const cost = bulkCost(id, owned, n);
          return (
            <Item
              key={id}
              coach={COACH_IDS[id]}
              icon={ic[id]}
              title={t(`b.${id}` as Key)}
              count={owned}
              desc={t(`b.${id}.d` as Key)}
              chips={[
                <Chip tone="compute">+{fmt(b.flops)} FLOP/s</Chip>,
                <Chip tone="power">{fmtPower(b.powerMW)}</Chip>,
              ]}
              price={`$${fmt(cost)}`}
              qty={n > 1 ? `×${n}` : undefined}
              ok={s.cash.gte(cost)}
              eta={eta(cost, s)}
              onBuy={() => dispatch({ type: 'buy', building: id, count: n })}
            />
          );
        })}
        {nextEra && (
          <div class="item locked">
            <div class="item-icon">?</div>
            <div class="item-main">
              <div class="item-title">{t('locked')}</div>
              <div class="item-desc">{t('lockedEra', { era: tk(`era.${BUILDINGS[nextEra].era}`) })}</div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

function Item(p: {
  coach?: string;
  icon?: string;
  title: string;
  count?: number;
  desc: string;
  chips: preact.ComponentChildren[];
  price: string;
  qty?: string;
  action?: string;
  ok: boolean;
  eta: string | null;
  hot?: boolean;
  safety?: boolean;
  onBuy: () => void;
}) {
  return (
    <div class={`item${p.hot ? ' hot' : ''}${p.safety ? ' safety' : ''}`}>
      <div class="item-icon">{p.icon && <img src={p.icon} alt="" class="px-icon" />}</div>
      <div class="item-main">
        <div class="item-title">
          {p.title}
          {p.count !== undefined && p.count > 0 && <span class="count">×{p.count}</span>}
        </div>
        <div class="item-desc">{p.desc}</div>
        <div class="chips">{p.chips}</div>
      </div>
      <button class="key key-buy" data-coach={p.coach} disabled={!p.ok} onClick={p.onBuy}>
        <span class="price">{p.price}</span>
        <span class="key-sub">{p.ok ? (p.qty ?? p.action ?? t('buyMode')) : p.eta}</span>
      </button>
    </div>
  );
}

// --- leaderboard ---------------------------------------------------------

const ROW_H = 46;

export function Leaderboard() {
  const s = game.value;
  const me = s.capability.toNumber();
  const goal = eraOf(s).goal;
  const rows = [
    { id: 'you', name: displayLab(), desc: t('you'), cap: me, me: true },
    ...RIVALS.map((r) => ({
      id: r.id,
      name: tk(`rival.${r.id}`),
      desc: tk(`rival.${r.id}.d`),
      cap: rivalCap(r, s.time),
      me: false,
    })),
  ];
  const order = [...rows].sort((a, b) => b.cap - a.cap).map((r) => r.id);

  // remember when each row last moved up or down, to flash an arrow for a few seconds
  const prev = useRef<string[]>(order);
  const moves = useRef<Record<string, { dir: number; at: number }>>({});
  useEffect(() => {
    const now = performance.now();
    order.forEach((id, pos) => {
      const was = prev.current.indexOf(id);
      if (was !== -1 && was !== pos) moves.current[id] = { dir: was > pos ? 1 : -1, at: now };
    });
    prev.current = order;
  });
  const now = performance.now();

  return (
    <Section
      title={t('leaderboard')}
      extra={<span class="rank-chip">#{playerRank(s)}</span>}
      class="board-window"
    >
      <p class="intro">{t('lbHint')}</p>
      <ol class="board" data-coach="rank" style={{ height: `${rows.length * ROW_H}px` }}>
        {rows.map((r) => {
          const pos = order.indexOf(r.id);
          const gap = r.cap - me;
          const move = moves.current[r.id];
          const recent = move && now - move.at < 4000 ? move.dir : 0;
          return (
            <li
              key={r.id}
              class={`${r.me ? 'me' : ''}${recent > 0 ? ' up' : recent < 0 ? ' down' : ''}`}
              style={{ transform: `translateY(${pos * ROW_H}px)` }}
              title={r.desc}
            >
              <span class="board-rank">
                {pos + 1}
                {recent !== 0 && <i class="board-move">{recent > 0 ? '▲' : '▼'}</i>}
              </span>
              <div class="board-main">
                <div class="board-top">
                  <span class="board-name">{r.name}</span>
                  <span class="board-cap">{fmt(r.cap)}</span>
                </div>
                <div class="board-bar">
                  <Bar value={r.cap / goal} tone={r.me ? 'cap' : 'ink-3'} />
                  {!r.me && (
                    <span class={`board-gap ${gap > 0 ? 'tone-doom' : 'tone-ok'}`}>
                      {gap > 0 ? t('gapAhead', { n: fmt(gap) }) : t('gapBehind', { n: fmt(-gap) })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

// --- log -----------------------------------------------------------------

export function LabLog() {
  return (
    <Section title={t('log')} class="log-window">
      <ul class="log">
        {log.value.length === 0 && <li class="dim">—</li>}
        {log.value.map((l) => (
          <li key={l.id} class={`tone-${l.tone}`}>
            <span class="ts">T+{fmtClock(l.at)}</span> {l.text}
          </li>
        ))}
      </ul>
    </Section>
  );
}
