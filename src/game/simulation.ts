import { activeCheats } from './cheats'
import { BALL, BRICKS, FIELD, LOST_Y, PADDLE, POINTS } from './constants'
import { bounce, circleRect, clamp, type Hit } from './physics'
import { POWERUP, POWERUPS, type PowerUpKind, pickPowerUp } from './powerups'
import { type BallState, type BrickState, SERVE_Y, world } from './world'

// Pas de temps fixe : la physique se comporte pareil quel que soit le taux de rafraîchissement.
export const STEP = 1 / 240

export type StepInput = {
  keyDirection: number // -1, 0 ou 1
  launch: boolean // lance la balle posée sur la raquette
}

const MIN_X = -FIELD.width / 2 + BALL.radius
const MAX_X = FIELD.width / 2 - BALL.radius
const MAX_Y = FIELD.height / 2 - BALL.radius
// Pour ne jamais traverser un obstacle, la balle avance d'au plus une fraction de son rayon par sous-pas
const MAX_MOVE = BALL.radius * 0.5
const BRICK_HALF_W = BRICKS.width / 2
const BRICK_HALF_H = BRICKS.height / 2
// God mode « mort impossible » : plancher au bas du terrain, sur lequel la balle rebondit
export const GOD_FLOOR_Y = -FIELD.height / 2

export function step(dt: number, input: StepInput) {
  world.time += dt
  tickEffects(dt)
  updatePaddle(dt, input.keyDirection)

  const serving = world.balls.some((ball) => ball.stuck)
  if (input.launch && serving) world.launchQueued = true
  // Laser : tir automatique en continu pendant toute la durée de l'effet, une fois la balle en jeu
  if (world.effects.laser !== undefined && !serving) fireLaser()
  // Un lancement demandé pendant l'entrée des briques est différé jusqu'à la fin de l'animation
  if (world.launchQueued && world.time >= world.readyAt) {
    world.launchQueued = false
    launchBalls()
  }

  const before = world.balls.length
  world.balls = world.balls.filter((ball) => updateBall(ball, dt))
  updatePowerUps(dt)
  updateLasers(dt)
  if (before > 0 && world.balls.length === 0) world.events.push({ type: 'allBallsLost' })
}

// ---------- Raquette ----------

function updatePaddle(dt: number, keyDirection: number) {
  const paddle = world.paddle
  if (keyDirection !== 0) paddle.targetX = paddle.x + keyDirection * PADDLE.keyboardSpeed * dt

  // La largeur change en douceur quand un effet de taille commence ou se termine
  const sizeFactor = world.effects.expand ? POWERUP.expandFactor : world.effects.shrink ? POWERUP.shrinkFactor : 1
  paddle.width += (PADDLE.width * sizeFactor - paddle.width) * Math.min(1, dt * 12)

  const limit = FIELD.width / 2 - paddle.width / 2
  paddle.targetX = clamp(paddle.targetX, -limit, limit)
  paddle.vx = (paddle.targetX - paddle.x) / dt
  paddle.x = paddle.targetX
}

// ---------- Balles ----------

function launchBalls() {
  let launched = false
  for (const ball of world.balls) {
    if (!ball.stuck) continue
    ball.stuck = false
    // Jamais parfaitement vertical, sinon la balle ferait des allers-retours sans fin
    const side = Math.random() < 0.5 ? -1 : 1
    const angle = side * (0.15 + Math.random() * 0.2)
    setVelocity(ball, angle)
    launched = true
  }
  if (launched) world.events.push({ type: 'launched' })
}

// Vitesse réelle : progression du niveau, modulée par les effets « balle lente » ou « balle rapide »
function currentSpeed() {
  const factor = world.effects.slow ? POWERUP.slowFactor : world.effects.fast ? POWERUP.fastFactor : 1
  return world.speed * factor
}

// Angle mesuré depuis la verticale : 0 = tout droit vers le haut
function setVelocity(ball: BallState, angle: number) {
  ball.vx = Math.sin(angle) * currentSpeed()
  ball.vy = Math.cos(angle) * currentSpeed()
}

// Remet la balle à la vitesse courante sans changer sa direction,
// en imposant une composante verticale minimale.
function normalizeVelocity(ball: BallState) {
  const speed = currentSpeed()
  const current = Math.hypot(ball.vx, ball.vy) || 1
  let vx = (ball.vx / current) * speed
  let vy = (ball.vy / current) * speed
  const minVy = speed * BALL.minVertical
  if (Math.abs(vy) < minVy) {
    vy = (Math.sign(vy) || 1) * minVy
    vx = (Math.sign(vx) || 1) * Math.sqrt(speed * speed - vy * vy)
  }
  ball.vx = vx
  ball.vy = vy
}

function normalizeAllBalls() {
  for (const ball of world.balls) if (!ball.stuck) normalizeVelocity(ball)
}

// Renvoie false si la balle est perdue
function updateBall(ball: BallState, dt: number): boolean {
  if (ball.stuck) {
    ball.x = world.paddle.x + ball.stuckOffset
    ball.y = SERVE_Y
    return true
  }

  const distance = Math.hypot(ball.vx, ball.vy) * dt
  const substeps = Math.max(1, Math.ceil(distance / MAX_MOVE))
  const subDt = dt / substeps

  for (let i = 0; i < substeps; i++) {
    ball.x += ball.vx * subDt
    ball.y += ball.vy * subDt
    collideWalls(ball)
    collideBricks(ball)
    collidePaddle(ball)
    if (activeCheats().invincible && ball.y < GOD_FLOOR_Y + BALL.radius) {
      ball.y = GOD_FLOOR_Y + BALL.radius
      ball.vy = Math.abs(ball.vy)
      world.events.push({ type: 'wallHit', x: ball.x, y: ball.y })
    }

    if (ball.y < LOST_Y) {
      world.events.push({ type: 'ballLost', x: ball.x })
      return false
    }
  }
  return true
}

function collideWalls(ball: BallState) {
  if (ball.x < MIN_X) {
    ball.x = MIN_X
    ball.vx = Math.abs(ball.vx)
    world.events.push({ type: 'wallHit', x: ball.x, y: ball.y })
  } else if (ball.x > MAX_X) {
    ball.x = MAX_X
    ball.vx = -Math.abs(ball.vx)
    world.events.push({ type: 'wallHit', x: ball.x, y: ball.y })
  }
  if (ball.y > MAX_Y) {
    ball.y = MAX_Y
    ball.vy = -Math.abs(ball.vy)
    world.events.push({ type: 'wallHit', x: ball.x, y: ball.y })
  }
}

function collidePaddle(ball: BallState) {
  if (ball.vy > 0) return
  const paddle = world.paddle
  const hit = circleRect(ball.x, ball.y, BALL.radius, {
    x: paddle.x,
    y: PADDLE.y,
    halfW: paddle.width / 2,
    halfH: PADDLE.height / 2,
  })
  if (!hit) return

  if (ball.y < PADDLE.y) {
    // Touchée par le côté, sous le dessus de la raquette : simple rebond, la balle reste perdue
    bounce(ball, hit)
    return
  }

  // L'angle de renvoi dépend du point d'impact : centre → vertical, bords → très incliné
  const offset = clamp((ball.x - paddle.x) / (paddle.width / 2 + BALL.radius), -1, 1)
  ball.y = PADDLE.y + PADDLE.height / 2 + BALL.radius
  setVelocity(ball, offset * PADDLE.maxBounceAngle)
  world.combo = 0
  world.events.push({ type: 'paddleHit', x: ball.x, y: ball.y })
}

// ---------- Briques ----------

function collideBricks(ball: BallState) {
  const hits: { index: number; hit: Hit }[] = []
  world.bricks.forEach((brick, index) => {
    if (!brick.alive) return
    const hit = circleRect(ball.x, ball.y, BALL.radius, {
      x: brick.x,
      y: brick.y,
      halfW: BRICK_HALF_W,
      halfH: BRICK_HALF_H,
    })
    if (hit) hits.push({ index, hit })
  })
  if (hits.length === 0) return

  // Balle perforante : elle détruit les briques sans rebondir, sauf sur le métal
  const piercing = world.effects.pierce !== undefined
  const solid = piercing ? hits.filter(({ index }) => world.bricks[index].type === 'steel') : hits

  // Une balle peut toucher deux briques à la fois (à la jointure) : on les traite ensemble,
  // avec un seul rebond sur la normale moyenne, pour ne pas inverser la direction deux fois.
  if (solid.length > 0) {
    let nx = 0
    let ny = 0
    let deepest = solid[0].hit
    for (const { hit } of solid) {
      nx += hit.nx
      ny += hit.ny
      if (hit.depth > deepest.depth) deepest = hit
    }
    const length = Math.hypot(nx, ny)
    bounce(ball, length > 1e-6 ? { nx: nx / length, ny: ny / length, depth: deepest.depth } : deepest)
  }

  for (const { index } of hits) {
    if (piercing && world.bricks[index].type !== 'steel') destroyBrick(index)
    else damageBrick(index)
  }
  // L'accélération s'applique à toutes les balles : en multi-balle, elles gardent la même vitesse
  world.speed = Math.min(BALL.maxSpeed, world.speed + BALL.speedGain)
  normalizeAllBalls()
}

function damageBrick(index: number) {
  const brick = world.bricks[index]
  brick.hitAt = world.time
  if (brick.type === 'steel') {
    world.events.push({ type: 'brickHit', index })
    return
  }
  brick.hp--
  if (brick.hp > 0) world.events.push({ type: 'brickHit', index })
  else destroyBrick(index)
}

function destroyBrick(first: number) {
  // File d'attente : une explosion peut en déclencher d'autres en chaîne
  const queue = [first]
  while (queue.length > 0) {
    const index = queue.shift()!
    const brick = world.bricks[index]
    if (!brick.alive || brick.type === 'steel') continue

    brick.alive = false
    brick.hp = 0
    brick.destroyedAt = world.time
    world.bricksLeft--
    world.combo++
    const multiplier = comboMultiplier(world.combo)
    world.events.push({
      type: 'brickDestroyed',
      index,
      points: basePoints(brick) * multiplier,
      multiplier,
      combo: world.combo,
    })
    maybeDropPowerUp(brick)

    if (brick.type === 'explosive') queue.push(...neighbours(brick))
  }

  if (world.bricksLeft === 0) world.events.push({ type: 'levelCleared' })
}

// God mode : détruit d'un coup toutes les briques destructibles (le niveau se termine)
export function clearLevel() {
  world.bricks.forEach((brick, index) => {
    if (brick.alive && brick.type !== 'steel') destroyBrick(index)
  })
}

// Les 8 cases autour d'une brique
function neighbours(brick: BrickState): number[] {
  const result: number[] = []
  world.bricks.forEach((other, index) => {
    if (other === brick || !other.alive) return
    const dx = Math.abs(other.x - brick.x)
    const dy = Math.abs(other.y - brick.y)
    if (dx < BRICKS.cellWidth * 1.5 && dy < BRICKS.cellHeight * 1.5) result.push(index)
  })
  return result
}

function basePoints(brick: BrickState) {
  if (brick.type === 'strong') return POINTS.strong * brick.maxHp
  if (brick.type === 'explosive') return POINTS.explosive
  return POINTS.normal
}

// ×1 pour les 3 premières briques d'une série, puis +1 toutes les 3 briques, jusqu'à ×5
export function comboMultiplier(combo: number) {
  return Math.min(5, 1 + Math.floor((combo - 1) / 3))
}

// ---------- Bonus ----------

function maybeDropPowerUp(brick: BrickState) {
  // Pas de capsule sur la dernière brique : le niveau se termine aussitôt
  if (world.bricksLeft === 0 || world.powerUps.length >= POWERUP.maxFalling) return
  if (Math.random() >= (activeCheats().dropChance ?? POWERUP.dropChance)) return
  world.powerUps.push({ kind: pickPowerUp(), x: brick.x, y: brick.y, spawnedAt: world.time })
}

function updatePowerUps(dt: number) {
  const paddle = world.paddle
  world.powerUps = world.powerUps.filter((powerUp) => {
    powerUp.y -= POWERUP.fallSpeed * dt
    const caught =
      Math.abs(powerUp.x - paddle.x) < (paddle.width + POWERUP.width) / 2 &&
      Math.abs(powerUp.y - PADDLE.y) < (PADDLE.height + POWERUP.height) / 2
    if (caught) {
      world.events.push({ type: 'powerUpCollected', kind: powerUp.kind, x: powerUp.x })
      applyPowerUp(powerUp.kind)
      return false
    }
    return powerUp.y > LOST_Y
  })
}

export function applyPowerUp(kind: PowerUpKind) {
  const def = POWERUPS[kind]
  if (kind === 'multi') return splitBalls()
  if (kind === 'life') return world.events.push({ type: 'lifeGained' })

  // Un effet opposé en cours (grande / petite raquette, lente / rapide) est annulé
  if (def.excludes && world.effects[def.excludes] !== undefined) endEffect(def.excludes)
  // Ramasser un effet déjà actif relance sa durée
  world.effects[kind] = def.duration
  world.events.push({ type: 'effectStarted', kind, duration: def.duration })
  if (kind === 'slow' || kind === 'fast') normalizeAllBalls()
}

function tickEffects(dt: number) {
  if (activeCheats().frozenEffects) return
  for (const kind of Object.keys(world.effects) as PowerUpKind[]) {
    const remaining = world.effects[kind]! - dt
    if (remaining > 0) world.effects[kind] = remaining
    else endEffect(kind)
  }
}

export function endEffect(kind: PowerUpKind) {
  delete world.effects[kind]
  world.events.push({ type: 'effectEnded', kind })
  if (kind === 'slow' || kind === 'fast') normalizeAllBalls()
}

// Chaque balle en jeu se divise en trois, dans la limite de BALL.max
function splitBalls() {
  if (world.balls.every((ball) => ball.stuck)) launchBalls()
  const sources = world.balls.filter((ball) => !ball.stuck)
  for (const source of sources) {
    for (const angle of [-POWERUP.splitAngle, POWERUP.splitAngle]) {
      if (world.balls.length >= BALL.max) return
      const cos = Math.cos(angle)
      const sin = Math.sin(angle)
      const clone: BallState = {
        ...source,
        vx: source.vx * cos - source.vy * sin,
        vy: source.vx * sin + source.vy * cos,
      }
      normalizeVelocity(clone)
      world.balls.push(clone)
    }
  }
}

function fireLaser() {
  if (world.time - world.lastLaserAt < POWERUP.laserCooldown) return
  world.lastLaserAt = world.time
  const paddle = world.paddle
  const y = PADDLE.y + PADDLE.height / 2 + POWERUP.laserHeight / 2
  // Un tir depuis chaque canon, aux extrémités de la raquette
  const offset = paddle.width / 2 - 0.3
  world.lasers.push({ x: paddle.x - offset, y }, { x: paddle.x + offset, y })
  world.events.push({ type: 'laserFired' })
}

function updateLasers(dt: number) {
  world.lasers = world.lasers.filter((laser) => {
    laser.y += POWERUP.laserSpeed * dt
    if (laser.y > FIELD.height / 2) return false
    const index = world.bricks.findIndex(
      (brick) =>
        brick.alive &&
        Math.abs(laser.x - brick.x) < BRICK_HALF_W + POWERUP.laserWidth / 2 &&
        Math.abs(laser.y - brick.y) < BRICK_HALF_H + POWERUP.laserHeight / 2,
    )
    if (index < 0) return true
    damageBrick(index)
    return false
  })
}
