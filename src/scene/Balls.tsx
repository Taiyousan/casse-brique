import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { Mesh, MeshStandardMaterial } from 'three'
import { BALL, COLORS } from '../game/constants'
import { world } from '../game/world'

// Réserve fixe de balles : on affiche ou masque chaque mesh selon l'état de la simulation,
// sans jamais monter ni démonter de composant pendant la partie.
export function Balls() {
  const meshes = useRef<(Mesh | null)[]>([])
  // Matériau partagé : toutes les balles changent de couleur ensemble (balle perforante)
  const material = useMemo(() => new MeshStandardMaterial({ color: COLORS.ball, flatShading: true }), [])

  useFrame(() => {
    const piercing = world.effects.pierce !== undefined
    material.color.set(piercing ? COLORS.pierce : COLORS.ball)
    material.emissive.set(piercing ? COLORS.pierce : COLORS.ball)
    material.emissiveIntensity = piercing ? 0.9 : 0.35

    meshes.current.forEach((mesh, i) => {
      if (!mesh) return
      const ball = world.balls[i]
      mesh.visible = ball !== undefined
      if (ball) mesh.position.set(ball.x, ball.y, 0)
    })
  })

  return (
    <group>
      {Array.from({ length: BALL.max }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            meshes.current[i] = m
          }}
          material={material}
          visible={false}
          castShadow
        >
          <icosahedronGeometry args={[BALL.radius, 1]} />
        </mesh>
      ))}
    </group>
  )
}
