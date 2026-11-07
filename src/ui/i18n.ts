import { signal } from '@preact/signals';

export type Lang = 'en' | 'es';

const en = {
  // shell
  title: 'ASI RUSH',
  era: 'ERA I · THE GARAGE',
  year: '1986',
  goal: 'Series A',
  goalHint: 'Reach {n} Capability to close your Series A.',
  help: 'How to play',
  settings: 'Settings',
  sound: 'Sound',
  music: 'Music',
  on: 'On',
  off: 'Off',
  language: 'Language',
  close: 'Close',

  // boot + briefing
  bootPress: 'PRESS ANY KEY OR TAP TO CONTINUE',
  briefingTag: 'CLASSIFIED BRIEFING · 1986',
  briefing1:
    'The Cold War has a new front: minds made of silicon. Four labs are racing to build Artificial Superintelligence.',
  briefing2: 'You have a garage, a credit card and no adult supervision.',
  briefingGoal: 'Era I goal: reach {n} Capability and close a Series A before your rivals do.',
  how1: 'Run benchmarks to raise your first dollars.',
  how2: 'Buy hardware. More hardware means more compute.',
  how3: 'Split compute: serving earns cash, training earns Capability.',
  how4: 'Ship models, publish research and keep the fuse from blowing.',
  labNameLabel: 'Name your lab',
  labNameDefault: 'Garage Intelligence',
  start: 'Start the race',
  continue: 'Back to the lab',
  briefingFoot:
    'About 25–35 minutes. Saves automatically and keeps training while you are away (up to 24 h).',

  // resources
  runway: 'Runway',
  runwayTip: 'Cash. Earned by serving your model to paying customers.',
  compute: 'Compute',
  computeTip: 'Floating-point operations per second your hardware delivers right now.',
  power: 'Power',
  powerTip: 'Draw vs. what your fuse can take. Over the cap, everything slows down.',
  capability: 'Capability',
  capabilityTip: 'How smart your model is. Grows with training compute, with diminishing returns.',
  pdoom: 'P(doom)',
  pdoomTip: 'Odds this ends badly. Rises with Capability, falls with alignment research.',
  rank: 'Rank',
  throttled: 'THROTTLED',
  perSec: '/s',

  // actions
  benchmark: 'Run benchmark',
  benchmarkSub: 'Sell the results to a bank · +${n}',
  allocation: 'Compute allocation',
  serving: 'Serving',
  servingSub: 'cash',
  training: 'Training',
  trainingSub: 'capability',

  // tabs
  tabHardware: 'Hardware',
  tabResearch: 'Research',
  tabModels: 'Models',
  tabRace: 'Race',
  buyMode: 'Buy',
  buyMax: 'Max',
  owned: '×{n}',
  eta: 'in {t}',
  locked: 'Classified',
  lockedHint: 'Keep earning to unlock.',

  // hardware
  'b.homePc': 'Home PC',
  'b.homePc.d': '8 MHz, 640 KB and one beige box of raw ambition.',
  'b.accelCard': 'Accelerator Card',
  'b.accelCard.d': 'Overclocked math coprocessor. Smells faintly of toast.',
  'b.serverRack': 'Server Rack',
  'b.serverRack.d': "Liquidated from a bankrupt savings & loan. Still has the bank's logo.",
  fuse: 'Bigger Fuse',
  'fuse.d': "Electrician says it's technically legal in three states.",
  fuseEffect: 'Power cap ×2 · level {n}',

  // research
  researchIntro: 'Papers unlock as your model gets smarter. Each one is permanent.',
  researchNone: 'Nothing to publish yet. Train more.',
  researchDone: 'Published',
  researchNext: 'Next paper unlocks at {n} Capability',
  publish: 'Publish',
  'r.backprop': 'Backpropagation',
  'r.backprop.d': 'Hot off a 1986 paper. Tells the model exactly what it got wrong.',
  'r.perTokenBilling': 'Per-Token Billing',
  'r.perTokenBilling.d': 'Charge per word. Customers love a surprise invoice.',
  'r.usenet': 'Scrape Usenet',
  'r.usenet.d': 'Pretraining data: 40% flame wars, 60% sci-fi fan fiction.',
  'r.undervolting': 'Undervolting',
  'r.undervolting.d': 'Same math, fewer sparks.',
  'r.redTeam': 'Red Team (Two Interns)',
  'r.redTeam.d': 'Paid in pizza to make the model say bad words.',
  'r.halfPrecision': 'Half-Precision Floats',
  'r.halfPrecision.d': 'Who needs the other 16 bits?',
  'r.scalingMemo': 'Scaling Laws Memo',
  'r.scalingMemo.d': 'Bigger model, better model. Peer review: pending.',
  'r.rlhf': 'RLHF',
  'r.rlhf.d': 'Reinforcement Learning from Hallway Feedback.',
  'r.attention': 'Attention (Leaked Fax)',
  'r.attention.d': 'A fax from the future. Nobody can read the date.',
  effCap: 'Training ×{n}',
  effCash: 'Revenue ×{n}',
  effFlops: 'Compute ×{n}',
  effPower: 'Power draw −{n}%',
  effAlign: 'Alignment +{n}',

  // models
  modelsIntro: 'Ship a model when Capability is high enough. Better models charge more per token.',
  shipIt: 'Ship it',
  shipNeeds: 'Needs {n} Capability',
  shipped: 'Shipped',
  params: '{n} params',
  priceUp: 'Price ×{n} · launch hype +${c}',
  allShipped: 'Model lineup complete for Era I.',
  'm.0': 'Autocompletes “Dear Sir or Madam”. Investors weep.',
  'm.1': 'Writes haiku. Mostly about fuses.',
  'm.2': 'Passes the bar exam. The one at the pub down the street.',
  'm.3': 'Refuses requests with stunning confidence. Hallucinates with even more.',
  'm.4': 'Same model, new font. Twice the price.',

  // race
  raceIntro: 'Frontier lab leaderboard, by Capability. First to {n} gets the Series A.',
  you: 'You',
  'rival.halcyon': 'Halcyon Neural',
  'rival.halcyon.d': 'Ex-academics. Publish everything, ship nothing. Until now.',
  'rival.sovereign': 'Sovereign Logic Bureau',
  'rival.sovereign.d': 'State-funded. Has a bigger fuse than you. Has all the fuses.',
  'rival.cogitron': 'Cogitron Industries',
  'rival.cogitron.d': 'Defense contractor. Every answer is a missile trajectory.',
  'rival.paragon': 'Paragon Cybernetics',
  'rival.paragon.d': 'Mall-kiosk startup. The CEO wears a turtleneck to the beach.',

  // objectives
  objective: 'Objective',
  'obj.benchmark': 'Run 5 benchmarks to raise seed money',
  'obj.pc': 'Buy your first Home PC',
  'obj.train': 'Train your model to 1 Capability',
  'obj.ship': 'Ship your first model (Models tab)',
  'obj.research': 'Publish your first paper (Research tab)',
  'obj.card': 'Buy an Accelerator Card',
  'obj.fuse': 'Keep the lights on: buy a Bigger Fuse',
  'obj.rank': 'Take #1 on the leaderboard',
  'obj.goal': 'Reach {n} Capability and close the Series A',

  // log + news events
  log: 'Lab log',
  newswire: 'Newswire',
  'ev.first.homePc': 'First Home PC online. The cat has been evicted from the garage.',
  'ev.first.accelCard': 'First accelerator installed. The garage now smells like toast.',
  'ev.first.serverRack': 'First server rack delivered. The neighbors have questions.',
  'ev.fuse': 'Bigger Fuse installed. Power cap is now {n}.',
  'ev.throttle': 'Power demand exceeds the fuse. Compute throttled to {n}%.',
  'ev.research': 'Paper published: {name}.',
  'ev.ship': '{model} shipped. Launch hype: +${n}.',
  'ev.overtake': 'You passed {lab} on the leaderboard. Now #{n}.',
  'ev.overtaken': '{lab} passed you on the leaderboard. Now #{n}.',
  'ev.welcome': 'Welcome back. While you were away ({t}): +${cash} and +{cap} Capability.',
  'ev.victory': 'Series A closed. Investors have noticed you.',
  'news.ship':
    'BREAKING: {lab} unveils {model}. Calls it “the most capable model in history”. History is 3 weeks old.',
  'news.overtake': 'MARKETS: {lab} slips to #{n} as unknown garage startup surges.',

  // save
  save: 'Save',
  saveNow: 'Save now',
  saved: 'Progress saved.',
  export: 'Export',
  import: 'Import',
  reset: 'Reset run',
  importPrompt: 'Paste a save string here, then press Import.',
  importBad: 'That save is corrupted. Or from a rival lab.',
  imported: 'Save imported.',
  resetConfirm: 'Wipe all progress? The board will not be informed.',
  copied: 'Copied to clipboard.',

  // victory
  victoryTag: 'ERA I COMPLETE',
  victoryTitle: 'Series A closed',
  victoryLead: 'Investors have noticed you. Your garage is about to become a datacenter.',
  statTime: 'Time',
  statRank: 'Final rank',
  statModels: 'Models shipped',
  statPapers: 'Papers',
  statPdoom: 'P(doom)',
  statFlops: 'Training FLOPs',
  shareX: 'Share on X',
  copyResult: 'Copy result',
  keepPlaying: 'Keep scaling',
  era2Soon: 'Era II · The Datacenter — coming soon.',
  shareText:
    'I built a superintelligence in my garage in 1986. Series A in {t}, finished #{rank} of 5 labs, P(doom) {p}. Beat that:',

  // help
  helpWhat: 'What is this?',
  helpWhatBody:
    'ASI RUSH is an incremental game about the AI race, set in an alternate 1986. You start in a garage and scale a lab by buying compute, training models and selling their output. Numbers go up. So does the risk.',
  helpLoop: 'The loop',
  helpGlossary: 'Glossary',
  'g.flops': 'FLOP/s — floating-point operations per second. Your raw compute.',
  'g.split':
    'Training vs. serving — training makes the model smarter (Capability); serving it to customers makes money. You choose the split.',
  'g.scaling':
    'Scaling laws — Capability grows with training compute, but with diminishing returns (∝ compute^0.35). Research multiplies it.',
  'g.power':
    'Power cap — if your hardware draws more than the fuse allows, all compute slows down proportionally. It never stops.',
  'g.models': 'Model releases — shipping a better model raises what you can charge for each token.',
  'g.pdoom':
    'P(doom) — the probability that this ends badly. Alignment research lowers it. Investors do not ask about it.',
  'g.offline': 'Saving — progress saves every 30 s and keeps running while you are away, for up to 24 hours.',
} as const;

export type Key = keyof typeof en;

const es: Record<Key, string> = {
  title: 'ASI RUSH',
  era: 'ERA I · EL GARAJE',
  year: '1986',
  goal: 'Serie A',
  goalHint: 'Llega a {n} de Capacidad para cerrar tu Serie A.',
  help: 'Cómo se juega',
  settings: 'Ajustes',
  sound: 'Sonido',
  music: 'Música',
  on: 'Sí',
  off: 'No',
  language: 'Idioma',
  close: 'Cerrar',

  bootPress: 'PULSA UNA TECLA O TOCA PARA CONTINUAR',
  briefingTag: 'INFORME CLASIFICADO · 1986',
  briefing1:
    'La Guerra Fría tiene un nuevo frente: mentes de silicio. Cuatro laboratorios compiten por construir una Superinteligencia Artificial.',
  briefing2: 'Tú tienes un garaje, una tarjeta de crédito y ningún adulto vigilando.',
  briefingGoal: 'Objetivo de la Era I: llegar a {n} de Capacidad y cerrar una Serie A antes que tus rivales.',
  how1: 'Ejecuta benchmarks para conseguir tus primeros dólares.',
  how2: 'Compra hardware. Más hardware, más cómputo.',
  how3: 'Reparte el cómputo: servir da dinero, entrenar da Capacidad.',
  how4: 'Lanza modelos, publica investigación y que no salte el fusible.',
  labNameLabel: 'Ponle nombre a tu laboratorio',
  labNameDefault: 'Garage Intelligence',
  start: 'Empezar la carrera',
  continue: 'Volver al laboratorio',
  briefingFoot: 'Unos 25–35 minutos. Se guarda solo y sigue entrenando mientras no estás (hasta 24 h).',

  runway: 'Caja',
  runwayTip: 'Dinero. Lo ganas sirviendo tu modelo a clientes que pagan.',
  compute: 'Cómputo',
  computeTip: 'Operaciones de coma flotante por segundo que da tu hardware ahora mismo.',
  power: 'Energía',
  powerTip: 'Consumo frente a lo que aguanta el fusible. Por encima, todo va más lento.',
  capability: 'Capacidad',
  capabilityTip: 'Lo listo que es tu modelo. Crece con el cómputo de entrenamiento, cada vez más despacio.',
  pdoom: 'P(doom)',
  pdoomTip:
    'Probabilidad de que esto acabe mal. Sube con la Capacidad y baja con la investigación en alineamiento.',
  rank: 'Puesto',
  throttled: 'LIMITADO',
  perSec: '/s',

  benchmark: 'Ejecutar benchmark',
  benchmarkSub: 'Vende los resultados a un banco · +${n}',
  allocation: 'Reparto de cómputo',
  serving: 'Servir',
  servingSub: 'dinero',
  training: 'Entrenar',
  trainingSub: 'capacidad',

  tabHardware: 'Hardware',
  tabResearch: 'Investigación',
  tabModels: 'Modelos',
  tabRace: 'Carrera',
  buyMode: 'Comprar',
  buyMax: 'Máx',
  owned: '×{n}',
  eta: 'en {t}',
  locked: 'Clasificado',
  lockedHint: 'Sigue ganando para desbloquearlo.',

  'b.homePc': 'PC doméstico',
  'b.homePc.d': '8 MHz, 640 KB y una caja beige llena de ambición.',
  'b.accelCard': 'Tarjeta aceleradora',
  'b.accelCard.d': 'Coprocesador matemático overclockeado. Huele un poco a tostada.',
  'b.serverRack': 'Rack de servidores',
  'b.serverRack.d': 'Rescatado de la liquidación de una caja de ahorros. Aún lleva el logo del banco.',
  fuse: 'Fusible más gordo',
  'fuse.d': 'El electricista dice que es técnicamente legal en tres estados.',
  fuseEffect: 'Límite de energía ×2 · nivel {n}',

  researchIntro: 'Los papers se desbloquean a medida que tu modelo es más listo. Cada uno es permanente.',
  researchNone: 'Aún no hay nada que publicar. Entrena más.',
  researchDone: 'Publicado',
  researchNext: 'El siguiente paper se desbloquea con {n} de Capacidad',
  publish: 'Publicar',
  'r.backprop': 'Retropropagación',
  'r.backprop.d': 'Recién salida de un paper de 1986. Le dice al modelo exactamente en qué se equivocó.',
  'r.perTokenBilling': 'Facturación por token',
  'r.perTokenBilling.d': 'Cobra por palabra. A los clientes les encantan las facturas sorpresa.',
  'r.usenet': 'Raspar Usenet',
  'r.usenet.d': 'Datos de preentrenamiento: 40% flame wars, 60% fan fiction de ciencia ficción.',
  'r.undervolting': 'Undervolting',
  'r.undervolting.d': 'Las mismas cuentas, menos chispas.',
  'r.redTeam': 'Red team (dos becarios)',
  'r.redTeam.d': 'Les pagan en pizza para que el modelo diga palabrotas.',
  'r.halfPrecision': 'Coma flotante de media precisión',
  'r.halfPrecision.d': '¿Quién necesita los otros 16 bits?',
  'r.scalingMemo': 'Memorándum de leyes de escala',
  'r.scalingMemo.d': 'Modelo más grande, modelo mejor. Revisión por pares: pendiente.',
  'r.rlhf': 'RLHF',
  'r.rlhf.d': 'Aprendizaje por refuerzo con feedback de pasillo.',
  'r.attention': 'Atención (fax filtrado)',
  'r.attention.d': 'Un fax del futuro. Nadie consigue leer la fecha.',
  effCap: 'Entrenamiento ×{n}',
  effCash: 'Ingresos ×{n}',
  effFlops: 'Cómputo ×{n}',
  effPower: 'Consumo −{n}%',
  effAlign: 'Alineamiento +{n}',

  modelsIntro:
    'Lanza un modelo cuando tengas Capacidad suficiente. Los mejores modelos cobran más por token.',
  shipIt: 'Lanzar',
  shipNeeds: 'Necesita {n} de Capacidad',
  shipped: 'Lanzado',
  params: '{n} parámetros',
  priceUp: 'Precio ×{n} · bombo del lanzamiento +${c}',
  allShipped: 'Catálogo de modelos completo para la Era I.',
  'm.0': 'Autocompleta «Estimado señor o señora». Los inversores lloran.',
  'm.1': 'Escribe haikus. Casi todos sobre fusibles.',
  'm.2': 'Aprueba el examen de abogacía. El del bar de la esquina.',
  'm.3': 'Rechaza peticiones con una seguridad pasmosa. Alucina con más seguridad todavía.',
  'm.4': 'El mismo modelo, otra tipografía. El doble de caro.',

  raceIntro:
    'Clasificación de laboratorios de frontera por Capacidad. El primero en llegar a {n} se lleva la Serie A.',
  you: 'Tú',
  'rival.halcyon': 'Halcyon Neural',
  'rival.halcyon.d': 'Exacadémicos. Lo publican todo y no lanzan nada. Hasta ahora.',
  'rival.sovereign': 'Sovereign Logic Bureau',
  'rival.sovereign.d':
    'Financiado por el Estado. Tiene un fusible más gordo que el tuyo. Tiene todos los fusibles.',
  'rival.cogitron': 'Cogitron Industries',
  'rival.cogitron.d': 'Contratista de defensa. Cada respuesta es una trayectoria de misil.',
  'rival.paragon': 'Paragon Cybernetics',
  'rival.paragon.d': 'Startup de quiosco de centro comercial. El CEO va a la playa en cuello alto.',

  objective: 'Objetivo',
  'obj.benchmark': 'Ejecuta 5 benchmarks para reunir capital semilla',
  'obj.pc': 'Compra tu primer PC doméstico',
  'obj.train': 'Entrena tu modelo hasta 1 de Capacidad',
  'obj.ship': 'Lanza tu primer modelo (pestaña Modelos)',
  'obj.research': 'Publica tu primer paper (pestaña Investigación)',
  'obj.card': 'Compra una tarjeta aceleradora',
  'obj.fuse': 'Que no se vaya la luz: compra un fusible más gordo',
  'obj.rank': 'Ponte el número 1 de la clasificación',
  'obj.goal': 'Llega a {n} de Capacidad y cierra la Serie A',

  log: 'Bitácora',
  newswire: 'Teletipo',
  'ev.first.homePc': 'Primer PC en marcha. El gato ha sido desahuciado del garaje.',
  'ev.first.accelCard': 'Primera aceleradora instalada. El garaje huele a tostada.',
  'ev.first.serverRack': 'Primer rack entregado. Los vecinos tienen preguntas.',
  'ev.fuse': 'Fusible más gordo instalado. El límite es ahora {n}.',
  'ev.throttle': 'La demanda supera el fusible. Cómputo limitado al {n}%.',
  'ev.research': 'Paper publicado: {name}.',
  'ev.ship': '{model} lanzado. Bombo del lanzamiento: +${n}.',
  'ev.overtake': 'Has adelantado a {lab}. Ahora vas #{n}.',
  'ev.overtaken': '{lab} te ha adelantado. Ahora vas #{n}.',
  'ev.welcome': 'Bienvenido de nuevo. Mientras no estabas ({t}): +${cash} y +{cap} de Capacidad.',
  'ev.victory': 'Serie A cerrada. Los inversores se han fijado en ti.',
  'news.ship':
    'ÚLTIMA HORA: {lab} presenta {model}. Lo llama «el modelo más capaz de la historia». La historia tiene 3 semanas.',
  'news.overtake': 'MERCADOS: {lab} cae al puesto #{n} ante el empuje de una startup de garaje desconocida.',

  save: 'Partida',
  saveNow: 'Guardar ahora',
  saved: 'Progreso guardado.',
  export: 'Exportar',
  import: 'Importar',
  reset: 'Reiniciar partida',
  importPrompt: 'Pega aquí una partida y pulsa Importar.',
  importBad: 'Esa partida está corrupta. O es de un laboratorio rival.',
  imported: 'Partida importada.',
  resetConfirm: '¿Borrar todo el progreso? No se informará al consejo.',
  copied: 'Copiado al portapapeles.',

  victoryTag: 'ERA I COMPLETADA',
  victoryTitle: 'Serie A cerrada',
  victoryLead: 'Los inversores se han fijado en ti. Tu garaje está a punto de convertirse en un datacenter.',
  statTime: 'Tiempo',
  statRank: 'Puesto final',
  statModels: 'Modelos lanzados',
  statPapers: 'Papers',
  statPdoom: 'P(doom)',
  statFlops: 'FLOPs de entrenamiento',
  shareX: 'Compartir en X',
  copyResult: 'Copiar resultado',
  keepPlaying: 'Seguir escalando',
  era2Soon: 'Era II · El Datacenter — próximamente.',
  shareText:
    'He construido una superinteligencia en mi garaje en 1986. Serie A en {t}, puesto #{rank} de 5 laboratorios, P(doom) {p}. Supéralo:',

  helpWhat: '¿Qué es esto?',
  helpWhatBody:
    'ASI RUSH es un juego incremental sobre la carrera de la IA, ambientado en un 1986 alternativo. Empiezas en un garaje y escalas un laboratorio comprando cómputo, entrenando modelos y vendiendo lo que producen. Los números suben. El riesgo también.',
  helpLoop: 'El bucle',
  helpGlossary: 'Glosario',
  'g.flops': 'FLOP/s — operaciones de coma flotante por segundo. Tu cómputo bruto.',
  'g.split':
    'Entrenar o servir — entrenar hace al modelo más listo (Capacidad); servirlo a clientes da dinero. Tú decides el reparto.',
  'g.scaling':
    'Leyes de escala — la Capacidad crece con el cómputo de entrenamiento, pero con rendimientos decrecientes (∝ cómputo^0,35). La investigación lo multiplica.',
  'g.power':
    'Límite de energía — si el hardware consume más de lo que aguanta el fusible, todo el cómputo se frena en proporción. Nunca se apaga.',
  'g.models': 'Lanzamientos — lanzar un modelo mejor sube lo que puedes cobrar por cada token.',
  'g.pdoom':
    'P(doom) — la probabilidad de que esto acabe mal. La investigación en alineamiento la reduce. Los inversores no preguntan.',
  'g.offline':
    'Guardado — la partida se guarda cada 30 s y sigue avanzando mientras no estás, hasta 24 horas.',
};

const DICTS: Record<Lang, Record<Key, string>> = { en, es };
const LANG_KEY = 'asi-rush-lang';

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch {
    /* storage unavailable */
  }
  return navigator.language.startsWith('es') ? 'es' : 'en';
}

export const lang = signal<Lang>(initialLang());

export function setLang(l: Lang) {
  lang.value = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* storage unavailable */
  }
}

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  return DICTS[lang.value][key].replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}

/** For keys built from data ids, e.g. `r.${id}`. */
export function tk(key: string, vars?: Record<string, string | number>): string {
  return key in en ? t(key as Key, vars) : key;
}
