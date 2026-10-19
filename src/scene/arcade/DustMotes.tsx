import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { AdditiveBlending, type BufferAttribute } from 'three'
import { createRandom } from '../../game/random'
import { SCREEN_FRONT } from './layout'

const COUNT = 140
const AREA = { width: 1.4, height: 1.1, depth: 1.3 } // volume devant l'écran de la borne

// Poussière en suspension dans la lueur de l'écran : de petits points qui dérivent lentement
export function DustMotes() {
  const { base, positions } = useMemo(() => {
    const random = createRandom(77)
    const base = new Float32Array(COUNT * 4) // x, y, z, phase
    for (let i = 0; i < COUNT; i++) {
      base[i * 4] = SCREEN_FRONT.x + (random() - 0.5) * AREA.width
      base[i * 4 + 1] = SCREEN_FRONT.y + (random() - 0.5) * AREA.height
      base[i * 4 + 2] = SCREEN_FRONT.z + random() * AREA.depth - 0.2
      base[i * 4 + 3] = random() * Math.PI * 2
    }
    return { base, positions: new Float32Array(COUNT * 3) }
  }, [])
  const attribute = useRef<BufferAttribute>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const phase = base[i * 4 + 3]
      positions[i * 3] = base[i * 4] + Math.sin(t * 0.13 + phase) * 0.08
      // Lente descente en boucle, avec un léger tourbillon
      positions[i * 3 + 1] = base[i * 4 + 1] + Math.sin(t * 0.09 + phase * 2) * 0.12
      positions[i * 3 + 2] = base[i * 4 + 2] + Math.cos(t * 0.11 + phase) * 0.08
    }
    attribute.current!.needsUpdate = true
  })

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute ref={attribute} attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#c9d6ff"
        size={0.009}
        transparent
        opacity={0.28}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  )
}
