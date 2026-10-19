import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { type Group, type Mesh, MeshStandardMaterial } from 'three'
import { POWERUP, POWERUP_KINDS, POWERUPS, type PowerUpKind } from '../game/powerups'
import { world } from '../game/world'
import { letterTexture } from './gameTextures'
import { lateMaterials } from './warmUp'

const RADIUS = POWERUP.height / 2
const BODY_LENGTH = POWERUP.width - POWERUP.height

// Capsules en chute : une réserve fixe de meshes, affichés selon l'état de la simulation.
export function PowerUps() {
  const groups = useRef<(Group | null)[]>([])
  const bodies = useRef<(Mesh | null)[]>([])
  const labels = useRef<(Mesh | null)[]>([])
  const { materials, rim } = useMemo(createMaterials, [])

  useFrame(() => {
    groups.current.forEach((group, i) => {
      if (!group) return
      const powerUp = world.powerUps[i]
      group.visible = powerUp !== undefined
      if (!powerUp) return
      group.position.set(powerUp.x, powerUp.y, 0)
      // Léger balancement, pour que la capsule attire l'œil sans masquer sa lettre
      group.rotation.y = Math.sin((world.time - powerUp.spawnedAt) * 4) * 0.5
      bodies.current[i]!.material = materials[powerUp.kind].body
      labels.current[i]!.material = materials[powerUp.kind].label
    })
  })

  return (
    <group>
      {Array.from({ length: POWERUP.maxFalling }, (_, i) => (
        <group
          key={i}
          ref={(g) => {
            groups.current[i] = g
          }}
          visible={false}
        >
          {/* Capsule couchée : son axe est horizontal */}
          <mesh
            ref={(m) => {
              bodies.current[i] = m
            }}
            rotation-z={Math.PI / 2}
            castShadow
          >
            <capsuleGeometry args={[RADIUS, BODY_LENGTH, 4, 12]} />
          </mesh>
          {/* Bagues argentées de part et d'autre de la lettre */}
          {[-1, 1].map((side) => (
            <mesh key={side} position-x={side * BODY_LENGTH * 0.42} rotation-y={Math.PI / 2} material={rim}>
              <torusGeometry args={[RADIUS * 0.98, 0.035, 6, 16]} />
            </mesh>
          ))}
          <mesh
            ref={(m) => {
              labels.current[i] = m
            }}
            position-z={RADIUS + 0.01}
          >
            <planeGeometry args={[POWERUP.height * 0.75, POWERUP.height * 0.75]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function createMaterials() {
  const materials = {} as Record<PowerUpKind, { body: MeshStandardMaterial; label: MeshStandardMaterial }>
  for (const kind of POWERUP_KINDS) {
    const def = POWERUPS[kind]
    materials[kind] = {
      body: new MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.45,
        roughness: 0.3,
        metalness: 0.2,
      }),
      label: new MeshStandardMaterial({
        map: letterTexture(def.letter),
        transparent: true,
        emissive: '#ffffff',
        emissiveIntensity: 0.6,
      }),
    }
  }
  const rim = new MeshStandardMaterial({ color: '#e3e8f2', metalness: 0.8, roughness: 0.25 })
  // Posés sur les capsules seulement quand elles tombent : à compiler dès le chargement
  for (const { body, label } of Object.values(materials)) lateMaterials.add(body).add(label)
  return { materials, rim }
}
