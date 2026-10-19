import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Mesh } from 'three'
import { COLORS } from '../game/constants'
import { POWERUP } from '../game/powerups'
import { world } from '../game/world'

// Assez pour un tir continu : 2 tirs toutes les 0,25 s, qui traversent le terrain en moins d'une seconde
const CAPACITY = 16

export function Lasers() {
  const meshes = useRef<(Mesh | null)[]>([])

  useFrame(() => {
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const laser = world.lasers[i]
      mesh.visible = laser !== undefined
      if (laser) mesh.position.set(laser.x, laser.y, 0)
    })
  })

  return (
    <group>
      {Array.from({ length: CAPACITY }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m
          }}
          visible={false}
        >
          <boxGeometry args={[POWERUP.laserWidth, POWERUP.laserHeight, POWERUP.laserWidth]} />
          <meshStandardMaterial color={COLORS.laser} emissive={COLORS.laser} emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  )
}
