// Scene palette: night-blue exteriors, warm wood interior, beige 80s plastics, phosphor-green screens.
export const C = {
  ink: '#0b0a12',

  sky0: '#0b0a1f',
  sky1: '#141133',
  sky2: '#1f1845',
  sky3: '#33215a',
  horizon: '#552a5c',
  star: '#d6ceff',
  moon: '#f6ecd0',
  moonShade: '#d4c49a',

  city: '#1d1736',
  cityEdge: '#2a2147',
  cityLit: '#ffcf6a',
  hill: '#120f22',

  houseWall: '#2c2542',
  houseDark: '#1f1a31',
  houseTrim: '#3d3459',
  roof: '#3b1f2c',
  roofLight: '#53293a',
  roofDark: '#2a1520',
  window: '#ffc35a',
  windowDim: '#4a3a2c',
  tv: '#7fb4ff',

  grass: '#1c3527',
  grassLight: '#2a4d36',
  dirt: '#241a17',
  sidewalk: '#4a4458',
  curb: '#5f5871',
  asphalt: '#17151f',
  stripe: '#8a7a3a',

  wallBack: '#463a52',
  wallBackDark: '#3a3045',
  panel: '#5e3f2e',
  panelDark: '#4a3124',
  panelLight: '#734e39',
  pegboard: '#8c6c4a',
  pegHole: '#62492f',
  floor: '#575062',
  floorDark: '#433d4f',
  oil: '#2e2a38',
  slab: '#6e6880',
  slabDark: '#4c465c',
  ceiling: '#241e2e',
  door: '#8f8aa0',
  doorDark: '#6c6780',

  wood: '#7a4a2c',
  woodLight: '#9a6640',
  woodDark: '#55331e',

  beige: '#d6c59c',
  beigeLight: '#efe2bf',
  beigeDark: '#ab976d',
  beigeShadow: '#857353',

  screen: '#86ffb8',
  screenMid: '#3fbf7f',
  screenBg: '#0d271d',

  pcb: '#2f7a45',
  pcbLight: '#46a05f',
  pcbDark: '#1d4d2c',
  gold: '#e8c15a',
  chip: '#1c1c24',

  rack: '#3d4152',
  rackLight: '#5d637a',
  rackDark: '#25283a',
  vent: '#191b26',

  led: '#7dffb0',
  ledAmber: '#ffb33c',
  ledRed: '#ff5a52',
  ledBlue: '#5ec8ff',
  ledOff: '#20232e',

  metal: '#8a8296',
  metalLight: '#b0a9bb',
  metalDark: '#58526a',

  board: '#cfc9b8',
  boardEdge: '#9e9787',
  marker: '#3355d6',
  markerRed: '#d6384a',

  tube: '#f2fbff',
  tubeOff: '#6d7385',

  ac: '#cbc4b2',
  acDark: '#8e8878',

  skin: '#e2aa84',
  skinDark: '#b97e5d',
  hair: '#2e1d14',
  sweater: '#d8662e',
  sweaterDark: '#a8481c',
  jeans: '#344a7a',

  cable: '#141219',
  cableOrange: '#ff8a2a',

  tarp: '#2d4f8a',
  tarpLight: '#3d66ad',
  tarpDark: '#1e3663',

  pole: '#4a3426',
  poleDark: '#33231a',
  spark: '#fff3a0',
} as const;

export const hex = (c: string) => Number.parseInt(c.slice(1), 16);
