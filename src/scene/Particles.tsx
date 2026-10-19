import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, type InstancedMesh, MeshBasicMaterial, MeshStandardMaterial, Object3D } from 'three'
import { BRICKS, COLORS, PADDLE } from '../game/constants'
import { POWERUPS } from '../game/powerups'
import { world } from '../game/world'
import { brickColor } from './brickColor'
import { useGameEvents } from './useGameEvents'

const GRAVITY = 26
// Deux briques cassées à moins de cet intervalle (temps du jeu) forment une casse multiple
const SERIES_WINDOW = 0.08
// Sous la raquette, d'où partent les étincelles quand une balle est perdue
const LOST_SPARKS_Y = PADDLE.y - 1.2

type Particle = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  spin: number
  axis: number // rotation de départ, pour que les éclats ne soient pas tous alignés
  size: number
  life: number
  maxLife: number
  gravity: number
  color: Color
}

// Réserve fixe de particules, réutilisées en boucle : aucune allocation pendant la partie
function createPool(capacity: number) {
  return {
    items: Array.from(
      { length: capacity },
      (): Particle => ({
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        spin: 0,
        axis: 0,
        size: 0,
        life: 0,
        maxLife: 1,
        gravity: 0,
        color: new Color(),
      }),
    ),
    next: 0,
    alive: 0,
  }
}

type Pool = ReturnType<typeof createPool>

type Burst = {
  x: number
  y: number
  count: number
  color: string
  speed: number
  size: number
  life: number
  gravity?: number
  spreadX?: number // largeur de la zone de départ (une brique entière, par exemple)
  upward?: boolean // projetées vers le haut uniquement
}

function burst(pool: Pool, b: Burst) {
  for (let i = 0; i < b.count; i++) {
    const p = pool.items[pool.next]
    pool.next = (pool.next + 1) % pool.items.length
    const angle = b.upward ? Math.PI * (0.15 + Math.random() * 0.7) : Math.random() * Math.PI * 2
    const speed = b.speed * (0.4 + Math.random() * 0.8)
    p.x = b.x + (Math.random() - 0.5) * (b.spreadX ?? 0)
    p.y = b.y + (Math.random() - 0.5) * BRICKS.height * 0.5
    p.z = 0.2
    p.vx = Math.cos(angle) * speed
    p.vy = Math.sin(angle) * speed + (b.upward ? 0 : speed * 0.3)
    // Vers la caméra, pour que les éclats sortent de l'écran
    p.vz = 2 + Math.random() * 5
    p.spin = (Math.random() - 0.5) * 18
    p.axis = Math.random() * Math.PI
    p.size = b.size * (0.6 + Math.random() * 0.7)
    p.life = p.maxLife = b.life * (0.7 + Math.random() * 0.6)
    p.gravity = b.gravity ?? GRAVITY
    p.color.set(b.color)
  }
}

// Éclats de briques (cubes éclairés) et étincelles (points lumineux), déclenchés par les événements du jeu
export function Particles() {
  const debris = useMemo(() => createPool(700), [])
  const sparks = useMemo(() => createPool(300), [])
  const debrisMesh = useRef<InstancedMesh>(null)
  const sparksMesh = useRef<InstancedMesh>(null)
  const materials = useMemo(
    () => ({
      debris: new MeshStandardMaterial({ roughness: 0.5 }),
      sparks: new MeshBasicMaterial({ toneMapped: false }),
    }),
    [],
  )
  const lastTime = useRef(world.time)

  // Éclats réservés aux casses multiples : une brique seule n'a que ses étincelles.
  // La première brique d'une série est mise de côté ; si une autre suit de près,
  // les éclats partent pour les deux, puis pour toutes les suivantes de la série.
  const series = useRef({ pending: -1, active: false, lastAt: -Infinity })
  const shatter = (index: number) => {
    const brick = world.bricks[index]
    const explosive = brick.type === 'explosive'
    burst(debris, {
      x: brick.x,
      y: brick.y,
      count: explosive ? 22 : 12,
      color: brickColor(brick),
      speed: explosive ? 11 : 6,
      size: 0.27,
      life: 0.9,
      spreadX: BRICKS.width,
    })
  }

  useGameEvents((event) => {
    switch (event.type) {
      case 'brickDestroyed': {
        const brick = world.bricks[event.index]
        const explosive = brick.type === 'explosive'
        burst(sparks, { x: brick.x, y: brick.y, count: explosive ? 18 : 6, color: explosive ? '#ffd23f' : '#ffffff', speed: explosive ? 14 : 7, size: 0.09, life: 0.35, gravity: 4 })

        const s = series.current
        const close = world.time - s.lastAt <= SERIES_WINDOW
        s.lastAt = world.time
        if (close && s.active) {
          shatter(event.index)
        } else if (close && s.pending >= 0) {
          s.active = true
          shatter(s.pending)
          shatter(event.index)
          s.pending = -1
        } else {
          // Nouvelle série : l'explosive a toujours ses éclats, les autres attendent une deuxième casse
          s.active = explosive
          s.pending = explosive ? -1 : event.index
          if (explosive) shatter(event.index)
        }
        break
      }
      case 'brickHit': {
        const brick = world.bricks[event.index]
        burst(sparks, { x: brick.x, y: brick.y, count: 5, color: brick.type === 'steel' ? COLORS.steel : '#ffffff', speed: 6, size: 0.08, life: 0.25, gravity: 4 })
        break
      }
      case 'paddleHit':
        burst(sparks, { x: event.x, y: event.y - 0.2, count: 6, color: COLORS.paddleLight, speed: 6, size: 0.08, life: 0.3, gravity: 10, upward: true })
        break
      case 'wallHit':
        burst(sparks, { x: event.x, y: event.y, count: 3, color: COLORS.neon, speed: 4, size: 0.07, life: 0.2, gravity: 2 })
        break
      case 'powerUpCollected':
        burst(sparks, { x: event.x, y: PADDLE.y + 0.3, count: 16, color: POWERUPS[event.kind].color, speed: 8, size: 0.1, life: 0.5, gravity: 6, upward: true })
        break
      case 'laserFired': {
        const offset = world.paddle.width / 2 - 0.3
        for (const side of [-1, 1]) {
          burst(sparks, { x: world.paddle.x + side * offset, y: PADDLE.y + 0.5, count: 2, color: COLORS.laser, speed: 3, size: 0.07, life: 0.15, gravity: 0, upward: true })
        }
        break
      }
      case 'ballLost':
        burst(sparks, { x: event.x, y: LOST_SPARKS_Y, count: 20, color: '#ff3b5c', speed: 9, size: 0.12, life: 0.6, gravity: 8, upward: true })
        break
    }
  })

  const dummy = useMemo(() => new Object3D(), [])

  // Avant le premier rendu : toutes les instances masquées (taille nulle),
  // et l'attribut de couleur par instance créé
  useLayoutEffect(() => {
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    for (const [mesh, pool] of [
      [debrisMesh.current!, debris],
      [sparksMesh.current!, sparks],
    ] as const) {
      pool.items.forEach((p, i) => {
        mesh.setMatrixAt(i, dummy.matrix)
        mesh.setColorAt(i, p.color)
      })
    }
  }, [debris, sparks, dummy])

  useFrame(() => {
    // Temps du jeu : les particules se figent pendant la pause et le micro-arrêt
    const dt = Math.min(0.05, world.time - lastTime.current)
    lastTime.current = world.time
    if (dt <= 0) return
    update(debrisMesh.current!, debris, dt, dummy, true)
    update(sparksMesh.current!, sparks, dt, dummy, false)
  })

  return (
    <>
      <instancedMesh ref={debrisMesh} args={[undefined, materials.debris, debris.items.length]} frustumCulled={false} castShadow>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
      <instancedMesh ref={sparksMesh} args={[undefined, materials.sparks, sparks.items.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </>
  )
}

function update(mesh: InstancedMesh, pool: Pool, dt: number, dummy: Object3D, tumble: boolean) {
  let alive = 0
  pool.items.forEach((p, i) => {
    if (p.life <= 0) {
      // Déjà masquée lors de sa dernière image : rien à mettre à jour
      if (p.size === 0) return
      p.size = 0
    } else {
      p.life -= dt
      p.vy -= p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.z += p.vz * dt
      alive++
    }
    const t = Math.max(0, p.life / p.maxLife)
    dummy.position.set(p.x, p.y, p.z)
    dummy.rotation.set(tumble ? p.axis + p.spin * (1 - t) : 0, tumble ? p.spin * (1 - t) * 0.7 : 0, 0)
    // Les éclats rapetissent en fin de vie, les étincelles s'éteignent plus vite
    dummy.scale.setScalar(p.life > 0 ? p.size * (tumble ? Math.sqrt(t) : t) : 0)
    dummy.updateMatrix()
    mesh.setMatrixAt(i, dummy.matrix)
    mesh.setColorAt(i, p.color)
  })
  if (alive > 0 || pool.alive > 0) {
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }
  pool.alive = alive
}
