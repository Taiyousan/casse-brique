import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { COLORS, PADDLE } from '../game/constants'
import { world } from '../game/world'
import { useGameEvents } from './useGameEvents'

const CAP = { length: 0.42, radius: PADDLE.height / 2 } // embouts rouges aux extrémités
const HIT_DURATION = 0.18 // durée de l'écrasement au rebond
const CANNON = { width: 0.22, height: 0.35 }
const BODY_WIDTH = PADDLE.width - CAP.length * 2

// Raquette façon vaisseau : corps argenté avec une bande lumineuse, embouts rouges arrondis.
// Seul le corps s'étire quand la largeur change ; les embouts gardent leur taille.
export function Paddle() {
  const body = useRef<Group>(null)
  const leftCap = useRef<Group>(null)
  const rightCap = useRef<Group>(null)
  const leftCannon = useRef<Mesh>(null)
  const rightCannon = useRef<Mesh>(null)

  const hitAt = useRef(-Infinity)
  const light = useRef<MeshStandardMaterial>(null)
  useGameEvents((event) => {
    if (event.type === 'paddleHit') hitAt.current = world.time
  })

  useFrame(() => {
    const { x, width } = world.paddle
    const bodyWidth = Math.max(0.1, width - CAP.length * 2)
    // Au rebond : la raquette s'enfonce et s'écrase un instant, sa bande lumineuse s'intensifie
    const impact = Math.max(0, 1 - (world.time - hitAt.current) / HIT_DURATION) ** 2
    const y = PADDLE.y - impact * 0.18
    body.current!.position.set(x, y, 0)
    body.current!.scale.set(bodyWidth / BODY_WIDTH, 1 - impact * 0.25, 1)
    leftCap.current!.position.set(x - width / 2 + CAP.length / 2, y, 0)
    rightCap.current!.position.set(x + width / 2 - CAP.length / 2, y, 0)
    light.current!.emissiveIntensity = 2 + impact * 4

    // Canons visibles pendant l'effet laser, aux points de départ des tirs
    const laser = world.effects.laser !== undefined
    const offset = width / 2 - 0.3
    leftCannon.current!.visible = laser
    rightCannon.current!.visible = laser
    leftCannon.current!.position.x = x - offset
    rightCannon.current!.position.x = x + offset
  })

  const cannonY = PADDLE.y + PADDLE.height / 2 + CANNON.height / 2

  return (
    <group>
      <group ref={body} position-y={PADDLE.y}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[BODY_WIDTH, PADDLE.height * 0.8, PADDLE.depth * 0.9]} />
          <meshStandardMaterial color={COLORS.paddleBody} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Bande lumineuse en façade */}
        <mesh position-z={PADDLE.depth * 0.45 + 0.01}>
          <boxGeometry args={[BODY_WIDTH * 0.85, PADDLE.height * 0.22, 0.02]} />
          <meshStandardMaterial ref={light} color={COLORS.paddleLight} emissive={COLORS.paddleLight} emissiveIntensity={2} />
        </mesh>
      </group>

      {[leftCap, rightCap].map((ref, i) => (
        <group key={i} ref={ref} position-y={PADDLE.y}>
          <mesh rotation-z={Math.PI / 2} castShadow>
            <capsuleGeometry args={[CAP.radius, CAP.length - CAP.radius * 2 + 0.1, 3, 10]} />
            <meshStandardMaterial color={COLORS.paddleCaps} metalness={0.3} roughness={0.35} />
          </mesh>
        </group>
      ))}

      {[leftCannon, rightCannon].map((ref, i) => (
        <mesh key={i} ref={ref} position={[0, cannonY, 0]} visible={false} castShadow>
          <boxGeometry args={[CANNON.width, CANNON.height, CANNON.width]} />
          <meshStandardMaterial color={COLORS.laser} emissive={COLORS.laser} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  )
}
