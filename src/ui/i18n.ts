import { signal } from '@preact/signals';
import { storyEn, storyEs } from './story.ts';

export type Lang = 'en' | 'es';

const core = {
  // shell
  title: 'ASI RUSH',
  heroTagline: 'The race to artificial intelligence, from beige PCs to superintelligence.',
  roundHint:
    'Milestone: the first lab to {n} Capability achieves "{round}". If a rival gets there before you, you lose the era.',
  deadline: '{lab} gets there in {t}',
  deadlineNow: '{lab} is about to close it',
  youEta: 'you: ~{t}',
  youStalled: 'you: not training',
  help: 'How to play',
  settings: 'Settings',
  sound: 'Sound',
  music: 'Music',
  on: 'On',
  off: 'Off',
  language: 'Language',
  close: 'Close',
  fullscreen: 'Fullscreen',

  // boot + briefing
  bootPress: 'PRESS ANY KEY OR TAP TO CONTINUE',
  pressStart: 'PRESS ANY KEY OR CLICK TO START',
  titleCredit: 'An incremental game about the real race to AI',
  briefingTag: 'MISSION BRIEFING',
  briefing1:
    'This is the story of the race to build thinking machines: AI summers and winters, backprop and transformers, garages and gigawatt campuses.',
  briefing2: 'You start in a garage with a beige PC. Every lab that ever chased AI is racing you.',
  briefingGoal:
    'Five eras, five milestones: from reading handwritten digits to superintelligence. Reach each one before the rival labs of the time.',
  how1: 'Run benchmarks to raise your first dollars.',
  how2: 'Buy hardware. More hardware means more compute.',
  how3: 'Split compute: serving earns cash, training earns Capability.',
  how4: 'Ship models, publish papers, keep P(doom) down and the fuse in one piece.',
  labNameLabel: 'Name your lab',
  labNameDefault: 'Garage Intelligence',
  start: 'Start the race',
  continue: 'Back to the lab',
  briefingFoot:
    'About 90 minutes for all five eras. Saves automatically. The game pauses whenever you leave: nobody moves while you are away.',

  // resources
  runway: 'Runway',
  runwayTip: 'Cash. Earned by serving your model to paying customers.',
  compute: 'Compute',
  computeTip: 'Floating-point operations per second your hardware delivers right now.',
  power: 'Power',
  powerTip: 'Draw vs. what your site can take. Over the cap, everything slows down.',
  capability: 'Capability',
  capabilityTip: 'How smart your model is. It decides the funding rounds and the leaderboard.',
  pdoom: 'P(doom)',
  pdoomTip:
    'Odds this ends badly. It grows with Capability and cuts your revenue (public trust). At 99% the game is over. Alignment papers bring it down.',
  trust: 'revenue ×{n}',
  throttled: 'THROTTLED',
  perSec: '/s',

  // deck
  benchmark: 'Run benchmark',
  benchmarkSub: 'Sell the results · +${n}',
  clickUpgrade: 'Upgrade',
  clickMult: 'clicks ×{n}',
  clickPct: '+{n}% of revenue per click',
  clickDone: 'Benchmarking fully optimized.',
  allocation: 'Compute allocation',
  serving: 'Serving',
  training: 'Training',
  allocTotal: '{n} FLOP/s to split',
  servingWhat: 'Customers pay per token. Funds hardware and research.',
  trainingWhat: 'Makes the model smarter: unlocks releases and papers, wins rounds.',
  presetCash: 'Make money',
  presetBalanced: 'Balanced',
  presetTrain: 'Get smarter',
  nextRelease: 'Next release {model} in {t}',
  nextReleaseReady: '{model} is ready to ship',

  // sections
  secRelease: 'Next release',
  secResearch: 'Research',
  secHardware: 'Hardware',
  buyMode: 'Buy',
  buyMax: 'Max',
  eta: 'in {t}',
  locked: 'Classified',
  lockedHint: 'Keep earning to unlock.',
  lockedEra: 'Unlocks in {era}.',

  // hardware
  powerEffect: 'Power cap ×2 · level {n}',

  // research
  researchNone: 'Nothing to publish yet. Train more.',
  researchPublished: 'Published papers ({n})',
  researchNext: 'Next paper unlocks at {n} Capability',
  publish: 'Publish',
  etaTraining: '~{t} at current training',
  noTraining: 'move the slider toward Training',
  effCap: 'Training ×{n}',
  effCash: 'Revenue ×{n}',
  effFlops: 'Compute ×{n}',
  effPower: 'Power draw −{n}%',
  effAlign: 'Alignment +1 · P(doom) ↓',

  // click upgrades
  'c.cherryPicked': 'Cherry-Picked Examples',
  'c.evalSuite': 'In-House Eval Suite',
  'c.overfit': 'Leaderboard Overfitting',
  'c.contamination': 'Benchmark Contamination',
  'c.vibes': 'Vibes-Based Evals',
  'c.pressRelease': 'Press Release Generator',
  'c.saturation': 'Benchmark Saturation',

  // models
  shipIt: 'Ship it',
  shipNeeds: 'Needs {n} Capability',
  params: '{n} params',
  priceUp: 'Price ×{n} · launch hype +${c}',
  allShipped: 'Model lineup complete for this era.',

  // rivals (parody, obviously)
  you: 'You',

  // leaderboard
  leaderboard: 'Frontier leaderboard',
  lbHint: 'Capability of every lab. Rivals improve in jumps when they ship.',
  gapAhead: '+{n} ahead',
  gapBehind: '{n} behind',

  // objectives / tutorial
  objective: 'Tutorial',
  'obj.benchmark': 'Run 5 benchmarks to raise seed money',
  'obj.pc': 'Buy your first Home PC',
  'obj.train': 'Train your model to 1 Capability',
  'obj.ship': 'Ship your first model',
  'obj.research': 'Publish your first paper',
  'obj.card': 'Buy an Accelerator Card',
  'obj.fuse': 'Keep the lights on: buy a Bigger Fuse',
  'obj.rank': 'Pass all four rival labs on the leaderboard',
  'obj.goal': 'Reach the first milestone: {n} Capability before the rivals',
  coachTag: 'Tutorial · {i}/{n}',
  tipTag: 'Tip',
  coachNext: 'Got it',
  coachSkip: 'Skip tutorial',
  'coach.benchmark': 'Click here to run a benchmark. A bank pays $2 for each result. Space works too.',
  'coach.pc': 'Buy your first Home PC. Hardware gives you compute, and compute runs all day.',
  'coach.train':
    'Your compute is split two ways. Serving sells your model for cash. Training makes it smarter (Capability). Keep some on Training.',
  'coach.ship': 'Your model is good enough to sell. Ship it: every release raises your price per token.',
  'coach.research':
    'Papers are permanent upgrades: training speed, revenue, compute or safety. This first one costs almost nothing and speeds up training by half. Later ones cost more and multiply more.',
  'coach.card': 'Accelerator cards give 12× the compute of a PC. Buy one.',
  'coach.fuse': 'The fuse is the limit. Above it all compute slows down. Buy a Bigger Fuse.',
  'coach.rank': 'This is the race. Four rival labs train too, and they jump forward each time they ship.',
  'coach.goal':
    'This bar is the milestone of your era. Reach it before any rival to move on to the next era. The countdown shows when the fastest rival gets there.',
  'tip.click':
    'Your benchmark button can be upgraded. Later upgrades add a share of your revenue to every click.',
  'tip.pdoom':
    'P(doom) is rising. It already cuts your revenue, and at 99% the game is over. Alignment papers (green) bring it down.',
  'tip.deadline':
    'A rival is close to the goal. If they reach it first you lose the round. Push training now.',

  // log + news events
  log: 'Lab log',
  newswire: 'Newswire',
  'ev.first.homePc': 'First beige PC online. The cat has been evicted from the garage.',
  'ev.first.accelCard': 'First coprocessor card seated. The garage now smells like toast.',
  'ev.first.workstation': 'First Unix workstation arrives. It cost more than the car. It is purple.',
  'ev.first.towerPc': 'First black tower on a desk. The intern named it Optimus.',
  'ev.first.rackServer': 'First 1U server in the closet. The closet now hums.',
  'ev.first.gamingRig': 'First gaming rig built. It is for research. The RGB is for research too.',
  'ev.first.gpuServer': 'First GPU server on the shelf. The loft is warmer than the summer.',
  'ev.first.dgxPod': 'First AI pod rolled in on a pallet. Gold-plated, like the invoice.',
  'ev.first.tensorPod': 'First tensor pod plumbed in. The datacenter now has a plumber.',
  'ev.first.rubinRack': 'First superchip rack powered up. One rack, one small town of electricity.',
  'ev.first.dataHall': 'First data hall online. A nearby lake reports feeling warm.',
  'ev.fuse': 'Power upgraded. Site capacity is now {n}.',
  'ev.throttle': 'Power demand exceeds capacity. Compute throttled to {n}%.',
  'ev.research': 'Paper published: {name}.',
  'ev.ship': '{model} shipped. Launch hype: +${n}.',
  'ev.click': 'Benchmark upgrade: {name}.',
  'ev.rival': '{lab} shipped {model}.',
  'ev.overtake': 'You passed {lab} on the leaderboard. Now #{n}.',
  'ev.overtaken': '{lab} passed you on the leaderboard. Now #{n}.',
  'ev.lost': '{lab} closed the round first. Your investors followed them.',
  'ev.doom': 'P(doom) reached 99%. Containment breach.',
  'news.ship':
    'BREAKING: {lab} unveils {model}. Calls it “the most capable model in history”. History is 3 weeks old.',
  'news.overtake': 'MARKETS: {lab} slips to #{n} as an unknown garage startup surges.',

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

  // round closed / defeat / victory
  roundTag: 'MILESTONE REACHED',
  moveOn: 'Move to {era}',
  lostTag: 'ERA LOST',
  lostTitle: '{lab} got there first: "{round}"',
  lostLead:
    'History remembers who got there first. This time it was not you. The lights in your lab go out one by one.',
  doomTag: 'GAME OVER',
  doomTitle: 'Containment breach',
  doomLead: 'P(doom) hit 99%. The model has left the building. Literally: it took the building.',
  lostHint: 'Tip: keep more compute on training, publish papers early and watch the countdown.',
  retryEra: 'Retry this era',
  newGame: 'New game',
  victoryTag: 'THE END',
  victoryTitle: 'Superintelligence achieved',
  victoryLead: 'You got there first. History will remember {lab}. History is now written by {lab}.',
  victoryDoom: 'P(doom) at the finish: {p}. The investors would like to not discuss that.',
  statTime: 'Time',
  statRank: 'Final rank',
  statModels: 'Models shipped',
  statPapers: 'Papers',
  statPdoom: 'P(doom)',
  statFlops: 'Training FLOPs',
  shareX: 'Share on X',
  copyResult: 'Copy result',
  keepPlaying: 'Keep scaling',
  shareText:
    'I took a lab from a garage to superintelligence in {t}, beating every AI lab in history. P(doom) {p}. Beat that:',

  // help
  helpWhat: 'What is this?',
  helpWhatBody:
    'ASI RUSH retells the real race to artificial intelligence as an incremental game, from beige PCs in a garage in the 80s to superintelligence on a gigawatt campus. Buy the hardware of each era, publish the papers that made history, ship models, and beat the labs of every age to each milestone.',
  helpLoop: 'The loop',
  helpWin: 'Winning and losing',
  helpWinBody:
    'Each era has a milestone (the bar above the lab). Reach its Capability before every rival to move on to the next era and its hardware. If a rival gets there first, you lose the era and can replay it. If P(doom) reaches 99%, the game is over.',
  helpGlossary: 'Glossary',
  'g.flops': 'FLOP/s — floating-point operations per second. Your raw compute.',
  'g.split':
    'Training vs. serving — training makes the model smarter (Capability); serving it to customers makes money. You choose the split.',
  'g.scaling':
    'Scaling laws — Capability grows with training compute, with diminishing returns (∝ compute^0.35). Papers multiply it.',
  'g.power':
    'Power cap — if your hardware draws more than the site allows, all compute slows down proportionally. It never stops.',
  'g.models': 'Model releases — shipping a better model raises what you can charge for each token.',
  'g.pdoom':
    'P(doom) — the probability that this ends badly. It cuts revenue (public trust) and ends the game at 99%. Alignment papers lower it.',
  'g.offline':
    'Saving and pausing — progress saves every 30 s. The whole game pauses when you close or hide the tab: nothing moves while you are away, rivals included.',
} as const;

const en = { ...core, ...storyEn };

export type Key = keyof typeof en;

const es: Record<Key, string> = {
  ...storyEs,
  title: 'ASI RUSH',
  heroTagline: 'La carrera por la inteligencia artificial, de los PCs beige a la superinteligencia.',
  roundHint:
    'Hito: el primer laboratorio en llegar a {n} de Capacidad consigue «{round}». Si un rival llega antes que tú, pierdes la era.',
  deadline: '{lab} llega en {t}',
  deadlineNow: '{lab} está a punto de cerrarla',
  youEta: 'tú: ~{t}',
  youStalled: 'tú: sin entrenar',
  help: 'Cómo se juega',
  settings: 'Ajustes',
  sound: 'Sonido',
  music: 'Música',
  on: 'Sí',
  off: 'No',
  language: 'Idioma',
  close: 'Cerrar',
  fullscreen: 'Pantalla completa',

  bootPress: 'PULSA UNA TECLA O TOCA PARA CONTINUAR',
  pressStart: 'PULSA CUALQUIER TECLA O HAZ CLIC PARA EMPEZAR',
  titleCredit: 'Un juego incremental sobre la carrera real por la IA',
  briefingTag: 'INFORME DE MISIÓN',
  briefing1:
    'Esta es la historia de la carrera por construir máquinas que piensan: veranos e inviernos de la IA, retropropagación y transformers, garajes y campus de gigavatios.',
  briefing2:
    'Empiezas en un garaje con un PC beige. Todos los laboratorios que alguna vez persiguieron la IA corren contra ti.',
  briefingGoal:
    'Cinco eras, cinco hitos: de leer dígitos escritos a mano a la superinteligencia. Llega a cada uno antes que los laboratorios rivales de su época.',
  how1: 'Ejecuta benchmarks para conseguir tus primeros dólares.',
  how2: 'Compra hardware. Más hardware, más cómputo.',
  how3: 'Reparte el cómputo: servir da dinero, entrenar da Capacidad.',
  how4: 'Lanza modelos, publica papers, mantén bajo el P(doom) y que no salte el fusible.',
  labNameLabel: 'Ponle nombre a tu laboratorio',
  labNameDefault: 'Garage Intelligence',
  start: 'Empezar la carrera',
  continue: 'Volver al laboratorio',
  briefingFoot:
    'Unos 90 minutos para las cinco eras. Se guarda solo. La partida se pausa cuando te vas: nadie avanza mientras no estás.',

  runway: 'Caja',
  runwayTip: 'Dinero. Lo ganas sirviendo tu modelo a clientes que pagan.',
  compute: 'Cómputo',
  computeTip: 'Operaciones de coma flotante por segundo que da tu hardware ahora mismo.',
  power: 'Energía',
  powerTip: 'Consumo frente a lo que aguanta tu instalación. Por encima, todo va más lento.',
  capability: 'Capacidad',
  capabilityTip: 'Lo listo que es tu modelo. Decide las rondas de financiación y la clasificación.',
  pdoom: 'P(doom)',
  pdoomTip:
    'Probabilidad de que esto acabe mal. Crece con la Capacidad y recorta tus ingresos (confianza del público). Al 99% se acaba la partida. Los papers de alineamiento la bajan.',
  trust: 'ingresos ×{n}',
  throttled: 'LIMITADO',
  perSec: '/s',

  benchmark: 'Ejecutar benchmark',
  benchmarkSub: 'Vende los resultados · +${n}',
  clickUpgrade: 'Mejorar',
  clickMult: 'clics ×{n}',
  clickPct: '+{n}% de los ingresos por clic',
  clickDone: 'Benchmarks optimizados al máximo.',
  allocation: 'Reparto de cómputo',
  serving: 'Servir',
  training: 'Entrenar',
  allocTotal: '{n} FLOP/s para repartir',
  servingWhat: 'Los clientes pagan por token. Financia hardware e investigación.',
  trainingWhat: 'Hace el modelo más listo: desbloquea lanzamientos y papers, y gana rondas.',
  presetCash: 'Hacer caja',
  presetBalanced: 'Equilibrado',
  presetTrain: 'Más listo',
  nextRelease: 'Próximo lanzamiento {model} en {t}',
  nextReleaseReady: '{model} está listo para lanzar',

  secRelease: 'Próximo lanzamiento',
  secResearch: 'Investigación',
  secHardware: 'Hardware',
  buyMode: 'Comprar',
  buyMax: 'Máx',
  eta: 'en {t}',
  locked: 'Clasificado',
  lockedHint: 'Sigue ganando para desbloquearlo.',
  lockedEra: 'Se desbloquea en la {era}.',

  powerEffect: 'Límite de energía ×2 · nivel {n}',

  researchNone: 'Aún no hay nada que publicar. Entrena más.',
  researchPublished: 'Papers publicados ({n})',
  researchNext: 'El siguiente paper se desbloquea con {n} de Capacidad',
  publish: 'Publicar',
  etaTraining: '~{t} al ritmo actual',
  noTraining: 'mueve el control hacia Entrenar',
  effCap: 'Entrenamiento ×{n}',
  effCash: 'Ingresos ×{n}',
  effFlops: 'Cómputo ×{n}',
  effPower: 'Consumo −{n}%',
  effAlign: 'Alineamiento +1 · P(doom) ↓',

  'c.cherryPicked': 'Ejemplos escogidos a dedo',
  'c.evalSuite': 'Evaluaciones de la casa',
  'c.overfit': 'Sobreajuste al ranking',
  'c.contamination': 'Contaminación del benchmark',
  'c.vibes': 'Evaluación por sensaciones',
  'c.pressRelease': 'Generador de notas de prensa',
  'c.saturation': 'Saturación de benchmarks',

  shipIt: 'Lanzar',
  shipNeeds: 'Necesita {n} de Capacidad',
  params: '{n} parámetros',
  priceUp: 'Precio ×{n} · bombo del lanzamiento +${c}',
  allShipped: 'Catálogo de modelos completo en esta era.',

  you: 'Tú',

  leaderboard: 'Clasificación de frontera',
  lbHint: 'Capacidad de cada laboratorio. Los rivales avanzan a saltos cuando lanzan modelos.',
  gapAhead: '+{n} por delante',
  gapBehind: 'a {n}',

  objective: 'Tutorial',
  'obj.benchmark': 'Ejecuta 5 benchmarks para reunir capital semilla',
  'obj.pc': 'Compra tu primer PC doméstico',
  'obj.train': 'Entrena tu modelo hasta 1 de Capacidad',
  'obj.ship': 'Lanza tu primer modelo',
  'obj.research': 'Publica tu primer paper',
  'obj.card': 'Compra una tarjeta aceleradora',
  'obj.fuse': 'Que no se vaya la luz: compra un fusible más gordo',
  'obj.rank': 'Adelanta a los cuatro laboratorios rivales',
  'obj.goal': 'Consigue el primer hito: {n} de Capacidad antes que los rivales',
  coachTag: 'Tutorial · {i}/{n}',
  tipTag: 'Consejo',
  coachNext: 'Entendido',
  coachSkip: 'Saltar tutorial',
  'coach.benchmark':
    'Pulsa aquí para ejecutar un benchmark. Un banco paga 2 $ por cada resultado. También vale la barra espaciadora.',
  'coach.pc': 'Compra tu primer PC. El hardware te da cómputo, y el cómputo trabaja todo el día.',
  'coach.train':
    'Tu cómputo se reparte en dos. Servir vende tu modelo y da dinero. Entrenar lo hace más listo (Capacidad). Deja una parte entrenando.',
  'coach.ship': 'Tu modelo ya se puede vender. Lánzalo: cada lanzamiento sube tu precio por token.',
  'coach.research':
    'Los papers son mejoras permanentes: velocidad de entrenamiento, ingresos, cómputo o seguridad. Este primero casi no cuesta nada y acelera el entrenamiento a la mitad más. Los siguientes cuestan más y multiplican más.',
  'coach.card': 'Una tarjeta aceleradora da 12 veces el cómputo de un PC. Compra una.',
  'coach.fuse': 'El fusible es el límite. Por encima, todo el cómputo se frena. Compra un fusible más gordo.',
  'coach.rank':
    'Esta es la carrera. Cuatro laboratorios rivales también entrenan, y avanzan a saltos cada vez que lanzan.',
  'coach.goal':
    'Esta barra es el hito de tu era. Llega antes que cualquier rival para pasar a la siguiente era. La cuenta atrás indica cuándo llega el rival más rápido.',
  'tip.click':
    'Tu botón de benchmark se puede mejorar. Las mejoras posteriores suman a cada clic una parte de tus ingresos.',
  'tip.pdoom':
    'El P(doom) está subiendo. Ya te recorta los ingresos y al 99% se acaba la partida. Los papers de alineamiento (en verde) lo bajan.',
  'tip.deadline':
    'Un rival está cerca de la meta. Si llega antes, pierdes la ronda. Empuja el entrenamiento ya.',

  log: 'Bitácora',
  newswire: 'Teletipo',
  'ev.first.homePc': 'Primer PC beige en marcha. El gato ha sido desahuciado del garaje.',
  'ev.first.accelCard': 'Primera tarjeta coprocesadora instalada. El garaje huele a tostada.',
  'ev.first.workstation': 'Llega la primera estación Unix. Costó más que el coche. Es morada.',
  'ev.first.towerPc': 'Primera torre negra en una mesa. El becario la ha llamado Optimus.',
  'ev.first.rackServer': 'Primer servidor 1U en el armario. El armario ahora zumba.',
  'ev.first.gamingRig': 'Primer PC gaming montado. Es para investigar. El RGB también.',
  'ev.first.gpuServer': 'Primer servidor de GPUs en la estantería. El loft da más calor que el verano.',
  'ev.first.dgxPod': 'Llega el primer pod de IA en un palé. Bañado en oro, como la factura.',
  'ev.first.tensorPod': 'Primer pod tensorial conectado a la fontanería. El datacenter ya tiene fontanero.',
  'ev.first.rubinRack': 'Primer rack de superchips encendido. Un rack, la luz de un pueblo pequeño.',
  'ev.first.dataHall': 'Primera nave de datos en marcha. Un lago cercano dice que tiene calor.',
  'ev.fuse': 'Energía ampliada. La instalación aguanta ahora {n}.',
  'ev.throttle': 'La demanda supera la capacidad. Cómputo limitado al {n}%.',
  'ev.research': 'Paper publicado: {name}.',
  'ev.ship': '{model} lanzado. Bombo del lanzamiento: +${n}.',
  'ev.click': 'Mejora de benchmark: {name}.',
  'ev.rival': '{lab} ha lanzado {model}.',
  'ev.overtake': 'Has adelantado a {lab}. Ahora vas #{n}.',
  'ev.overtaken': '{lab} te ha adelantado. Ahora vas #{n}.',
  'ev.lost': '{lab} ha cerrado la ronda antes. Tus inversores se han ido con ellos.',
  'ev.doom': 'El P(doom) ha llegado al 99%. Fallo de contención.',
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

  roundTag: 'HITO CONSEGUIDO',
  moveOn: 'Ir a la {era}',
  lostTag: 'ERA PERDIDA',
  lostTitle: '{lab} llegó antes: «{round}»',
  lostLead:
    'La historia recuerda a quien llega primero. Esta vez no has sido tú. Las luces de tu laboratorio se apagan una a una.',
  doomTag: 'FIN DE LA PARTIDA',
  doomTitle: 'Fallo de contención',
  doomLead:
    'El P(doom) ha llegado al 99%. El modelo se ha ido del edificio. Literalmente: se ha llevado el edificio.',
  lostHint: 'Consejo: deja más cómputo entrenando, publica papers pronto y vigila la cuenta atrás.',
  retryEra: 'Reintentar esta era',
  newGame: 'Nueva partida',
  victoryTag: 'FIN',
  victoryTitle: 'Superinteligencia conseguida',
  victoryLead: 'Has llegado el primero. La historia recordará a {lab}. La historia la escribe ahora {lab}.',
  victoryDoom: 'P(doom) en la meta: {p}. Los inversores prefieren no hablar de eso.',
  statTime: 'Tiempo',
  statRank: 'Puesto final',
  statModels: 'Modelos lanzados',
  statPapers: 'Papers',
  statPdoom: 'P(doom)',
  statFlops: 'FLOPs de entrenamiento',
  shareX: 'Compartir en X',
  copyResult: 'Copiar resultado',
  keepPlaying: 'Seguir escalando',
  shareText:
    'He llevado un laboratorio del garaje a la superinteligencia en {t}, ganando a todos los laboratorios de IA de la historia. P(doom) {p}. Supéralo:',

  helpWhat: '¿Qué es esto?',
  helpWhatBody:
    'ASI RUSH cuenta la carrera real por la inteligencia artificial como un juego incremental: de los PCs beige de un garaje en los 80 a la superinteligencia en un campus de gigavatios. Compra el hardware de cada época, publica los papers que hicieron historia, lanza modelos y gana a los laboratorios de cada era en cada hito.',
  helpLoop: 'El bucle',
  helpWin: 'Ganar y perder',
  helpWinBody:
    'Cada era tiene un hito (la barra encima del laboratorio). Llega a su Capacidad antes que todos los rivales para pasar a la siguiente era y su hardware. Si un rival llega antes, pierdes la era y puedes repetirla. Si el P(doom) llega al 99%, se acaba la partida.',
  helpGlossary: 'Glosario',
  'g.flops': 'FLOP/s — operaciones de coma flotante por segundo. Tu cómputo bruto.',
  'g.split':
    'Entrenar o servir — entrenar hace al modelo más listo (Capacidad); servirlo a clientes da dinero. Tú decides el reparto.',
  'g.scaling':
    'Leyes de escala — la Capacidad crece con el cómputo de entrenamiento, con rendimientos decrecientes (∝ cómputo^0,35). Los papers lo multiplican.',
  'g.power':
    'Límite de energía — si el hardware consume más de lo que aguanta la instalación, todo el cómputo se frena en proporción. Nunca se apaga.',
  'g.models': 'Lanzamientos — lanzar un modelo mejor sube lo que puedes cobrar por cada token.',
  'g.pdoom':
    'P(doom) — la probabilidad de que esto acabe mal. Recorta los ingresos (confianza del público) y al 99% acaba la partida. Los papers de alineamiento lo bajan.',
  'g.offline':
    'Guardado y pausa — la partida se guarda cada 30 s. Todo se pausa cuando cierras u ocultas la pestaña: nada avanza mientras no estás, tampoco los rivales.',
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
  // a missing string must never throw: it would abort the action that triggered the text
  return (DICTS[lang.value][key] ?? en[key] ?? key).replace(/\{(\w+)\}/g, (_, k: string) =>
    String(vars[k] ?? `{${k}}`),
  );
}

/** For keys built from data ids, e.g. `r.${id}`. */
export function tk(key: string, vars?: Record<string, string | number>): string {
  return key in en ? t(key as Key, vars) : key;
}
