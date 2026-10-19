import { LEVELS } from './levels'
import { clamp } from './physics'
import { step } from './simulation'
import { loadLevel, serveBall, world } from './world'

// Démo du menu (« attract mode ») : comme sur une vraie borne, l'écran joue tout seul.
// Une petite IA déplace la raquette ; elle vise un peu à côté du centre pour varier les angles,
// et rate parfois la balle.

const PADDLE_SPEED = 17 // vitesse maximale de la raquette de la démo, en unités par seconde
const STALL_TIMEOUT = 40 // sans brique cassée pendant ce temps (balle coincée), on resert

export type Demo = {
  level: number
  aim: number // décalage visé par rapport au centre de la raquette
  lastProgressAt: number
}

export function createDemo(): Demo {
  return { level: 0, aim: 0, lastProgressAt: 0 }
}

export function stepDemo(demo: Demo, dt: number) {
  // La balle la plus basse qui descend, sinon n'importe laquelle
  const falling = world.balls.filter((ball) => !ball.stuck && ball.vy < 0)
  const target = falling.sort((a, b) => a.y - b.y)[0] ?? world.balls[0]
  const desired = target ? target.x + demo.aim : 0
  const maxMove = PADDLE_SPEED * dt
  world.paddle.targetX = world.paddle.x + clamp(desired - world.paddle.x, -maxMove, maxMove)

  // Relance automatique dès que la balle est posée (le lancement attend la fin de l'entrée des briques)
  step(dt, { keyDirection: 0, launch: world.balls.some((ball) => ball.stuck) })
}

// À appeler après chaque image de démo, avant de vider les événements
export function handleDemoEvents(demo: Demo) {
  for (const event of world.events) {
    switch (event.type) {
      case 'paddleHit':
        demo.aim = (Math.random() - 0.5) * world.paddle.width * 0.8
        break
      case 'brickDestroyed':
        demo.lastProgressAt = world.time
        break
      case 'levelCleared':
        demo.level = (demo.level + 1) % LEVELS.length
        loadLevel(demo.level)
        serveBall()
        demo.lastProgressAt = world.time
        return
      case 'allBallsLost':
        serveBall()
        break
    }
  }
  if (world.time - demo.lastProgressAt > STALL_TIMEOUT) {
    serveBall()
    demo.lastProgressAt = world.time
  }
}
