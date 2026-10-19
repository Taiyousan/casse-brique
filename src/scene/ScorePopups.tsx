import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CanvasTexture, type Mesh, MeshBasicMaterial, NearestFilter, SRGBColorSpace } from 'three'
import { COLORS } from '../game/constants'
import { world } from '../game/world'
import { useGameEvents } from './useGameEvents'

const CAPACITY = 14
const DURATION = 0.8
const RISE = 1.6 // montée, en unités du jeu
const SIZE = { width: 2.4, height: 0.6 } // taille du texte dans le jeu
const CANVAS = { width: 128, height: 32 }

type Popup = {
  mesh: Mesh | null
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  material: MeshBasicMaterial
  x: number
  y: number
  startedAt: number
}

// « +50 » qui s'élève au-dessus de chaque brique détruite, puis s'efface
export function ScorePopups() {
  const popups = useMemo<Popup[]>(
    () =>
      Array.from({ length: CAPACITY }, () => {
        const canvas = document.createElement('canvas')
        canvas.width = CANVAS.width
        canvas.height = CANVAS.height
        const texture = new CanvasTexture(canvas)
        texture.colorSpace = SRGBColorSpace
        texture.magFilter = NearestFilter
        const material = new MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false })
        return { mesh: null, ctx: canvas.getContext('2d')!, texture, material, x: 0, y: 0, startedAt: -Infinity }
      }),
    [],
  )
  const next = useRef(0)

  useGameEvents((event) => {
    if (event.type !== 'brickDestroyed') return
    const brick = world.bricks[event.index]
    const popup = popups[next.current]
    next.current = (next.current + 1) % CAPACITY

    const { ctx } = popup
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height)
    ctx.font = '16px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#000000'
    ctx.fillText(`+${event.points}`, CANVAS.width / 2 + 2, CANVAS.height / 2 + 2)
    ctx.fillStyle = COLORS.multiplier[Math.min(event.multiplier, COLORS.multiplier.length) - 1]
    ctx.fillText(`+${event.points}`, CANVAS.width / 2, CANVAS.height / 2)
    popup.texture.needsUpdate = true
    popup.x = brick.x
    popup.y = brick.y
    popup.startedAt = world.time
  })

  useFrame(() => {
    for (const popup of popups) {
      const progress = (world.time - popup.startedAt) / DURATION
      const mesh = popup.mesh!
      mesh.visible = progress >= 0 && progress < 1
      if (!mesh.visible) continue
      // Montée rapide qui ralentit, et fondu sur la fin
      mesh.position.set(popup.x, popup.y + RISE * (1 - (1 - progress) ** 3), 1.2)
      popup.material.opacity = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4
    }
  })

  return (
    <group>
      {popups.map((popup, i) => (
        <mesh
          key={i}
          ref={(m) => {
            popup.mesh = m
          }}
          material={popup.material}
          visible={false}
          renderOrder={5}
        >
          <planeGeometry args={[SIZE.width, SIZE.height]} />
        </mesh>
      ))}
    </group>
  )
}
