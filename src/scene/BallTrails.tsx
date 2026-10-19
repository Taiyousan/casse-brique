import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { type InstancedMesh, MeshBasicMaterial, Object3D } from 'three'
import { BALL, COLORS } from '../game/constants'
import { world } from '../game/world'

const LENGTH = 10 // positions mémorisées par balle
const SAMPLE = 1 / 90 // intervalle entre deux positions mémorisées, en temps du jeu

// Traînée lumineuse derrière chaque balle : ses dernières positions, de plus en plus petites
export function BallTrails() {
  const mesh = useRef<InstancedMesh>(null)
  const material = useMemo(
    () => new MeshBasicMaterial({ color: COLORS.neon, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }),
    [],
  )
  // Historique circulaire par balle : [x, y] × LENGTH
  const history = useMemo(() => Array.from({ length: BALL.max }, () => ({ points: [] as [number, number][] })), [])
  const lastSample = useRef(0)
  const dummy = useMemo(() => new Object3D(), [])

  useLayoutEffect(() => {
    dummy.scale.setScalar(0)
    dummy.updateMatrix()
    for (let i = 0; i < BALL.max * LENGTH; i++) mesh.current!.setMatrixAt(i, dummy.matrix)
  }, [dummy])

  useFrame(() => {
    material.color.set(world.effects.pierce !== undefined ? COLORS.pierce : COLORS.neon)

    // Échantillonne au rythme du jeu : la traînée se fige pendant la pause
    if (world.time - lastSample.current >= SAMPLE || world.time < lastSample.current) {
      lastSample.current = world.time
      history.forEach((trail, i) => {
        const ball = world.balls[i]
        if (!ball || ball.stuck) {
          trail.points.length = 0
          return
        }
        const last = trail.points[0]
        // Saut brusque (balle perdue et remplacée, nouvelle manche) : on repart de zéro
        if (last && Math.hypot(last[0] - ball.x, last[1] - ball.y) > 2) trail.points.length = 0
        trail.points.unshift([ball.x, ball.y])
        if (trail.points.length > LENGTH) trail.points.length = LENGTH
      })
    }

    const instanced = mesh.current!
    history.forEach((trail, i) => {
      for (let k = 0; k < LENGTH; k++) {
        const point = trail.points[k + 1] // la position actuelle est déjà occupée par la balle
        const scale = point ? (1 - (k + 1) / (LENGTH + 1)) * 0.85 : 0
        dummy.position.set(point?.[0] ?? 0, point?.[1] ?? 0, -0.05)
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        instanced.setMatrixAt(i * LENGTH + k, dummy.matrix)
      }
    })
    instanced.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, material, BALL.max * LENGTH]} frustumCulled={false}>
      <icosahedronGeometry args={[BALL.radius, 1]} />
    </instancedMesh>
  )
}
