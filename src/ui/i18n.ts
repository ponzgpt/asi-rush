import { signal } from '@preact/signals';

export type Lang = 'en' | 'es';

const en = {
  title: 'ASI RUSH',
  subtitle: 'Garage Era // 1986',
  cash: 'Cash',
  compute: 'Compute',
  power: 'Power',
  capability: 'Capability',
  risk: 'Risk',
  throttled: 'THROTTLED',
  benchmark: 'Run Benchmark',
  benchmarkHint: '+${n} per run',
  buildings: 'Hardware',
  homePc: 'Home PC',
  accelCard: 'Accelerator Card',
  serverRack: 'Server Rack',
  buy: 'Buy',
  owned: 'owned',
  fuse: 'Bigger Fuse',
  fuseHint: 'Power cap ×2 (level {n})',
  allocation: 'Compute allocation',
  training: 'Training',
  inference: 'Inference',
  log: 'Event log',
  save: 'Save',
  export: 'Export',
  import: 'Import',
  reset: 'Reset',
  resetConfirm: 'Wipe all progress? The board will not be informed.',
  importPrompt: 'Paste a save string, then press Import.',
  importBad: 'That save is corrupted. Or from a rival lab.',
  saved: 'Progress saved.',
  imported: 'Save imported.',
  welcomeBack: 'Welcome back. While you were away ({t}): +${cash}, +{cap} Capability.',
  firstTraining: 'Your first model converged. It mostly predicts the word "the".',
  firstFuse: 'Bigger Fuse installed. The neighborhood flickers in solidarity.',
  overPower: 'Power demand exceeds the fuse. Compute throttled.',
  eraComplete: 'Investors have noticed you. Era 2 coming soon.',
  bought: 'Acquired: {name}.',
} as const;

export type Key = keyof typeof en;

const es: Partial<Record<Key, string>> = {
  subtitle: 'Era del Garaje // 1986',
  cash: 'Dinero',
  compute: 'Cómputo',
  power: 'Energía',
  capability: 'Capacidad',
  risk: 'Riesgo',
  throttled: 'LIMITADO',
  benchmark: 'Ejecutar benchmark',
  benchmarkHint: '+${n} por ejecución',
  buildings: 'Hardware',
  homePc: 'PC doméstico',
  accelCard: 'Tarjeta aceleradora',
  serverRack: 'Rack de servidores',
  buy: 'Comprar',
  owned: 'en propiedad',
  fuse: 'Fusible más gordo',
  fuseHint: 'Límite de energía ×2 (nivel {n})',
  allocation: 'Reparto de cómputo',
  training: 'Entrenamiento',
  inference: 'Inferencia',
  log: 'Registro',
  save: 'Partida',
  export: 'Exportar',
  import: 'Importar',
  reset: 'Reiniciar',
  resetConfirm: '¿Borrar todo el progreso? No se informará al consejo.',
  importPrompt: 'Pega una partida y pulsa Importar.',
  importBad: 'Esa partida está corrupta. O es de un laboratorio rival.',
  saved: 'Progreso guardado.',
  imported: 'Partida importada.',
  welcomeBack: 'Bienvenido de nuevo. Mientras no estabas ({t}): +${cash}, +{cap} de Capacidad.',
  firstTraining: 'Tu primer modelo ha convergido. Sobre todo predice la palabra "el".',
  firstFuse: 'Fusible más gordo instalado. El barrio parpadea en solidaridad.',
  overPower: 'La demanda supera el fusible. Cómputo limitado.',
  eraComplete: 'Los inversores se han fijado en ti. La Era 2, próximamente.',
  bought: 'Adquirido: {name}.',
};

const DICTS: Record<Lang, Partial<Record<Key, string>>> = { en, es };
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
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {
    /* storage unavailable */
  }
}

export function t(key: Key, vars: Record<string, string | number> = {}): string {
  const text = DICTS[lang.value][key] ?? en[key];
  return text.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
