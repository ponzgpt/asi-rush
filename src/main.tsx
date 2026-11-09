import '@fontsource/silkscreen/400.css';
import '@fontsource/vt323/400.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import { effect } from '@preact/signals';
import { render } from 'preact';
import { musicEra, musicIntensity, playSfx, primeAudio, setHum, titleMusic } from './audio/audio.ts';
import { effectiveFlops } from './sim/sim.ts';
import { on } from './state/events.ts';
import { game, load } from './state/store.ts';
import { App } from './ui/App.tsx';
import { lang } from './ui/i18n.ts';
import './style.css';

const root = document.getElementById('app');
if (!root) throw new Error('#app missing from index.html');

load();
titleMusic.value = true; // the title screen is up until the player starts
primeAudio();
on(playSfx);
effect(() => {
  const s = game.value;
  const cap = s.capability.toNumber();
  const progress = s.era > 0 ? 3 : cap >= 60 ? 3 : cap >= 8 ? 2 : cap >= 1 ? 1 : 0;
  musicIntensity.value = titleMusic.value ? 2 : progress;
  musicEra.value = s.era;
  setHum(Math.log10(1 + effectiveFlops(s)) / 4);
});
effect(() => {
  document.documentElement.lang = lang.value;
});
render(<App />, root);
