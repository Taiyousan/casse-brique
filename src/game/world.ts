import { BALL, BRICKS, PADDLE } from './constants'
import { LEVELS, parseLevel } from './levels'
import type { PowerUpKind } from './powerups'

// État « rapide » de la simulation : modifié à chaque pas de physique,
// lu directement par les composants 3D dans useFrame. Il ne passe jamais par React.

export type BallState = {
  x: number
  y: number
  vx: number
  vy: number
  stuck: boolean // collée à la raquette, en attente de lancement
  stuckOffset: number // décalage horizontal par rapport au centre de la raquette
}

export type BrickType = 'normal' | 'strong' | 'steel' | 'explosive'

export type BrickState = {
  x: number
  y: number
  type: BrickType
  hp: number
  maxHp: number
  color: string // pour les briques normales ; les autres types ont une couleur fixe
  alive: boolean
  spawnAt: number // instant (world.time) où la brique commence sa chute d'entrée
  hitAt: number // instant du dernier impact, pour l'animation
  destroyedAt: number
}

// Capsule de bonus en train de tomber
export type PowerUpState = { kind: PowerUpKind; x: number; y: number; spawnedAt: number }

// Tir de laser en train de monter
export type LaserState = { x: number; y: number }

export type GameEvent =
  | { type: 'launched' }
  | { type: 'powerUpCollected'; kind: PowerUpKind; x: number }
  | { type: 'effectStarted'; kind: PowerUpKind; duration: number }
  | { type: 'effectEnded'; kind: PowerUpKind }
  | { type: 'lifeGained' }
  | { type: 'laserFired' }
  | { type: 'paddleHit'; x: number; y: number }
  | { type: 'wallHit'; x: number; y: number }
  | { type: 'brickHit'; index: number }
  // combo : rang de la brique dans la série en cours (1 = première depuis le dernier rebond sur la raquette)
  | { type: 'brickDestroyed'; index: number; points: number; multiplier: number; combo: number }
  | { type: 'levelCleared' }
  | { type: 'ballLost'; x: number }
  | { type: 'allBallsLost' }

export const world = {
  time: 0,
  paddle: {
    x: 0,
    targetX: 0,
    vx: 0,
    width: PADDLE.width,
  },
  balls: [] as BallState[],
  baseSpeed: BALL.speed, // vitesse au service, qui dépend du niveau
  speed: BALL.speed,
  bricks: [] as BrickState[],
  bricksLeft: 0, // briques destructibles restantes
  readyAt: 0, // fin de l'animation d'entrée : la balle ne part pas avant
  launchQueued: false, // lancement demandé pendant l'animation d'entrée
  combo: 0, // briques détruites depuis le dernier contact avec la raquette
  powerUps: [] as PowerUpState[],
  lasers: [] as LaserState[],
  lastLaserAt: -Infinity,
  // Effets en cours : temps restant en secondes
  effects: {} as Partial<Record<PowerUpKind, number>>,
  // File d'événements produits par la simulation, vidée à chaque image par la boucle de jeu
  events: [] as GameEvent[],
}

export const SERVE_Y = PADDLE.y + PADDLE.height / 2 + BALL.radius + 0.01

// Retire capsules, tirs et effets en cours (balle perdue, fin de niveau ou de partie)
export function clearTransient() {
  world.powerUps = []
  world.lasers = []
  world.effects = {}
}

// Nouvelle balle posée au centre de la raquette
export function serveBall() {
  clearTransient()
  world.speed = world.baseSpeed
  world.combo = 0
  world.launchQueued = false
  world.balls = [{ x: world.paddle.x, y: SERVE_Y, vx: 0, vy: 0, stuck: true, stuckOffset: 0 }]
}

export function loadLevel(index: number) {
  world.bricks = parseLevel(LEVELS[index % LEVELS.length], world.time)
  world.bricksLeft = world.bricks.filter((b) => b.type !== 'steel').length
  world.readyAt = Math.max(world.time, ...world.bricks.map((b) => b.spawnAt)) + BRICKS.enterDuration
  world.baseSpeed = BALL.speed + index * BALL.speedPerLevel
}

export function resetWorld(level = 0) {
  world.paddle.x = 0
  world.paddle.targetX = 0
  world.paddle.vx = 0
  world.paddle.width = PADDLE.width
  world.events.length = 0
  loadLevel(level)
  serveBall()
}
