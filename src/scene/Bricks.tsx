import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'
import { BRICKS, COLORS } from '../game/constants'
import { type BrickState, world } from '../game/world'
import { brickColor } from './brickColor'
import { brickBevelTexture } from './gameTextures'

const CAPACITY = BRICKS.columns * BRICKS.maxRows
const HIT_DURATION = 0.15 // durée du « pop » à l'impact, en secondes
const DESTROY_DURATION = 0.18 // durée du rétrécissement à la destruction
const ENTER_HEIGHT = 4 // hauteur de chute des briques à l'entrée du niveau
const FLASH_DURATION = 0.12 // flash blanc à l'impact
const WHITE = new Color('#ffffff')

// Tout le mur en deux InstancedMesh (un seul appel de dessin chacun) :
// les briques explosives à part, pour leur matériau lumineux qui pulse.
export function Bricks() {
  const { regular, explosive } = useMemo(() => {
    const bevel = brickBevelTexture()
    return {
      regular: new MeshStandardMaterial({ map: bevel, roughness: 0.5, metalness: 0.1 }),
      explosive: new MeshStandardMaterial({
        map: bevel,
        color: COLORS.explosive,
        emissive: COLORS.explosive,
        roughness: 0.5,
      }),
    }
  }, [])

  // Les briques explosives clignotent doucement, comme une mèche allumée
  useFrame(() => {
    explosive.emissiveIntensity = 0.35 + 0.35 * Math.sin(world.time * 6)
  })

  return (
    <>
      <BrickLayer material={regular} include={(b) => b.type !== 'explosive'} colored />
      <BrickLayer material={explosive} include={(b) => b.type === 'explosive'} />
    </>
  )
}

type LayerProps = {
  material: MeshStandardMaterial
  include: (brick: BrickState) => boolean
  colored?: boolean // couleur par instance (sinon, celle du matériau)
}

function BrickLayer({ material, include, colored = false }: LayerProps) {
  const mesh = useRef<InstancedMesh>(null)
  const { dummy, color } = useMemo(() => ({ dummy: new Object3D(), color: new Color() }), [])

  // Crée l'attribut de couleur par instance avant le premier rendu
  useLayoutEffect(() => {
    if (!colored) return
    for (let i = 0; i < CAPACITY; i++) mesh.current!.setColorAt(i, color.set('#ffffff'))
  }, [color, colored])

  useFrame(() => {
    const instanced = mesh.current!
    const bricks = world.bricks
    instanced.count = bricks.length

    bricks.forEach((brick, i) => {
      // Brique d'un autre calque : invisible ici
      if (!include(brick)) {
        dummy.scale.setScalar(0)
        dummy.updateMatrix()
        instanced.setMatrixAt(i, dummy.matrix)
        return
      }

      // Entrée du niveau : la brique tombe d'au-dessus et se pose avec un petit rebond
      const enter = Math.min(1, Math.max(0, (world.time - brick.spawnAt) / BRICKS.enterDuration))
      const drop = (1 - easeOutBack(enter)) * ENTER_HEIGHT

      let scale = enter > 0 ? 1 : 0
      if (!brick.alive) {
        scale = Math.max(0, 1 - (world.time - brick.destroyedAt) / DESTROY_DURATION)
      } else {
        const sinceHit = world.time - brick.hitAt
        if (sinceHit < HIT_DURATION) scale = 1 + 0.15 * (1 - sinceHit / HIT_DURATION)
      }

      dummy.position.set(brick.x, brick.y + drop, 0)
      // Légère rotation pendant la disparition
      dummy.rotation.set(0, 0, brick.alive ? 0 : (1 - scale) * 0.6)
      dummy.scale.setScalar(scale)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
      if (colored) {
        // Flash blanc bref à l'impact
        const flash = brick.alive ? Math.max(0, 1 - (world.time - brick.hitAt) / FLASH_DURATION) : 0
        instanced.setColorAt(i, color.set(brickColor(brick)).lerp(WHITE, flash * 0.85))
      }
    })

    instanced.instanceMatrix.needsUpdate = true
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, material, CAPACITY]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <boxGeometry args={[BRICKS.width, BRICKS.height, BRICKS.depth]} />
    </instancedMesh>
  )
}

// Dépasse légèrement la cible avant de s'y poser
function easeOutBack(t: number) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}
