import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { MeshBasicMaterial, type PerspectiveCamera, type Vector3 } from 'three'
import { world } from '../game/world'
import { useGameEvents } from './useGameEvents'

// « Trauma » ajouté par chaque événement : l'amplitude du tremblement en est le carré,
// ce qui rend les petits chocs discrets et les gros bien marqués.
const TRAUMA = {
  brick: 0.12,
  steel: 0.1,
  explosion: 0.55,
  ballLost: 0.5,
  levelCleared: 0.35,
}
const RECOVERY = 1.8 // trauma résorbé par seconde
const MAX_OFFSET = 0.7 // déplacement maximal de la caméra, en unités du jeu
const MAX_ROLL = 0.015 // inclinaison maximale, en radians

// Fait trembler la caméra du jeu (l'image dans l'écran de la borne), autour de sa position de repos
export function ScreenShake({ camera, rest }: { camera: PerspectiveCamera; rest: Vector3 }) {
  const trauma = useRef(0)
  const lastTime = useRef(world.time)

  useGameEvents((event) => {
    const add = (amount: number) => {
      trauma.current = Math.min(1, trauma.current + amount)
    }
    if (event.type === 'brickDestroyed') add(world.bricks[event.index].type === 'explosive' ? TRAUMA.explosion : TRAUMA.brick)
    else if (event.type === 'brickHit' && world.bricks[event.index].type === 'steel') add(TRAUMA.steel)
    else if (event.type === 'allBallsLost') add(TRAUMA.ballLost)
    else if (event.type === 'levelCleared') add(TRAUMA.levelCleared)
  })

  useFrame(() => {
    const dt = Math.max(0, world.time - lastTime.current)
    lastTime.current = world.time
    trauma.current = Math.max(0, trauma.current - RECOVERY * dt)
    const shake = trauma.current ** 2
    // Somme de sinus de fréquences différentes : un bruit irrégulier mais continu
    const t = world.time * 40
    camera.position.set(
      rest.x + MAX_OFFSET * shake * (Math.sin(t * 1.1) + Math.sin(t * 2.3 + 1)) * 0.5,
      rest.y + MAX_OFFSET * shake * (Math.sin(t * 1.7 + 2) + Math.sin(t * 2.9)) * 0.5,
      rest.z,
    )
    camera.rotation.z = MAX_ROLL * shake * Math.sin(t * 1.3 + 3)
  })

  return null
}

// Flash plein écran (blanc pour les explosions et la fin de niveau, rouge pour une balle perdue)
export function ScreenFlash() {
  const material = useMemo(
    () => new MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }),
    [],
  )
  const flash = useRef({ strength: 0 })
  const lastTime = useRef(world.time)

  useGameEvents((event) => {
    const trigger = (color: string, strength: number) => {
      if (strength < flash.current.strength) return
      material.color.set(color)
      flash.current.strength = strength
    }
    if (event.type === 'brickDestroyed' && world.bricks[event.index].type === 'explosive') trigger('#ffffff', 0.35)
    else if (event.type === 'allBallsLost') trigger('#ff2040', 0.35)
    else if (event.type === 'levelCleared') trigger('#ffffff', 0.6)
  })

  useFrame(() => {
    const dt = Math.max(0, world.time - lastTime.current)
    lastTime.current = world.time
    flash.current.strength = Math.max(0, flash.current.strength - dt * 2.5)
    material.opacity = flash.current.strength
  })

  // Plan à placer comme enfant de la caméra du jeu, sous l'interface (renderOrder inférieur)
  return (
    <mesh position-z={-1.01} material={material} renderOrder={9}>
      <planeGeometry args={[4, 4]} />
    </mesh>
  )
}
