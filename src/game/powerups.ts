// Bonus et malus qui tombent parfois d'une brique détruite.

export type PowerUpKind = 'expand' | 'shrink' | 'multi' | 'slow' | 'fast' | 'laser' | 'pierce' | 'life'

type PowerUpDef = {
  label: string
  letter: string // affichée sur la capsule et dans l'interface
  color: string
  weight: number // probabilité relative de tirage
  duration: number // en secondes ; 0 = effet immédiat
  malus?: boolean
  excludes?: PowerUpKind // effet opposé, annulé quand celui-ci démarre
}

// L'ordre est celui de l'encart du menu pause : bonus d'abord, malus ensuite
export const POWERUPS: Record<PowerUpKind, PowerUpDef> = {
  expand: { label: 'Grande raquette', letter: 'E', color: '#2de2a6', weight: 15, duration: 15, excludes: 'shrink' },
  multi: { label: 'Multi-balle', letter: 'M', color: '#3ab8ff', weight: 15, duration: 0 },
  slow: { label: 'Balle lente', letter: 'L', color: '#ffd23f', weight: 12, duration: 12, excludes: 'fast' },
  laser: { label: 'Laser', letter: 'T', color: '#ff4d4d', weight: 11, duration: 10 },
  pierce: { label: 'Balle perforante', letter: 'P', color: '#ff8a2a', weight: 7, duration: 8 },
  life: { label: 'Vie en plus', letter: '+', color: '#ff6fb5', weight: 4, duration: 0 },
  shrink: {
    label: 'Petite raquette',
    letter: 'R',
    color: '#9b7bd4',
    weight: 9,
    duration: 12,
    malus: true,
    excludes: 'expand',
  },
  fast: { label: 'Balle rapide', letter: 'V', color: '#c0563f', weight: 9, duration: 10, malus: true, excludes: 'slow' },
}

export const POWERUP_KINDS = Object.keys(POWERUPS) as PowerUpKind[]

export const POWERUP = {
  dropChance: 0.15,
  maxFalling: 3, // capsules en chute simultanées au maximum
  fallSpeed: 5,
  width: 1.1, // dimensions de la capsule (zone de ramassage)
  height: 0.5,
  expandFactor: 1.5,
  shrinkFactor: 0.65,
  slowFactor: 0.7,
  fastFactor: 1.3,
  splitAngle: 0.4, // écart (radians) des balles créées par le multi-balle
  laserSpeed: 28,
  laserCooldown: 0.3, // intervalle entre deux salves automatiques
  laserWidth: 0.12,
  laserHeight: 0.6,
}

export const MAX_LIVES = 5

const TOTAL_WEIGHT = POWERUP_KINDS.reduce((sum, kind) => sum + POWERUPS[kind].weight, 0)

export function pickPowerUp(): PowerUpKind {
  let roll = Math.random() * TOTAL_WEIGHT
  for (const kind of POWERUP_KINDS) {
    roll -= POWERUPS[kind].weight
    if (roll < 0) return kind
  }
  return POWERUP_KINDS[0]
}
