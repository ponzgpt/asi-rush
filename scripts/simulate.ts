// Headless balance run: `npm run sim -- [hours] [trainShare] [clicksPerSec] [--timeline]`.
// Prints milestone times as CSV, plus a per-minute timeline with --timeline.
import { DEFAULT_GREEDY, runGreedy } from '../src/sim/greedy.ts';
import { BUILDING_ORDER } from '../src/data/economy.ts';

const [hours, trainShare, clicks] = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('--'))
  .map(Number);
const { milestones, final, timeline } = runGreedy({
  maxSeconds: (hours || DEFAULT_GREEDY.maxSeconds / 3600) * 3600,
  trainShare:
    trainShare !== undefined && Number.isFinite(trainShare) ? trainShare : DEFAULT_GREEDY.trainShare,
  clicksPerSec: clicks || DEFAULT_GREEDY.clicksPerSec,
});

const fmt = (t: number) => `${Math.floor(t / 60)}m${String(Math.round(t % 60)).padStart(2, '0')}s`;
console.log('milestone,seconds,mm:ss');
for (const [m, t] of Object.entries(milestones).sort((a, b) => a[1] - b[1]))
  console.log(`${m},${t.toFixed(1)},${fmt(t)}`);
console.log(
  `# end t=${fmt(final.time)} cap=${final.capability.toFixed(1)} cash=${final.cash.toFixed(0)} fuse=${final.fuseLevel} ` +
    BUILDING_ORDER.map((id) => `${id}=${final.owned[id]}`).join(' '),
);

if (process.argv.includes('--timeline')) {
  console.log('\nt_seconds,capability,cash,flops,rank');
  for (const p of timeline)
    console.log(`${p.t},${p.cap.toFixed(1)},${p.cash.toFixed(0)},${p.flops.toFixed(0)},${p.rank}`);
}
