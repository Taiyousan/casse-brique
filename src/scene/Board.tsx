import { useMemo } from 'react'
import { COLORS, FIELD, FRAME, GROUND_Y, PANEL_Z } from '../game/constants'
import { gridTexture } from './gameTextures'

const HALF_W = FIELD.width / 2
const HALF_H = FIELD.height / 2
const T = FRAME.thickness
const TOP_Y = HALF_H + T
const PANEL_THICKNESS = 0.4
// Les éléments du cadre vont du panneau jusqu'à FRAME.depth devant lui
const FRAME_Z = PANEL_Z + FRAME.depth / 2
const NEON = 0.12 // épaisseur des tubes néon

// Panneau de jeu : fond quadrillé, deux montants et une traverse soulignés de néon.
// Le bas reste ouvert : c'est par là que la balle est perdue.
export function Board() {
  const pillarHeight = TOP_Y - GROUND_Y
  const pillarY = (TOP_Y + GROUND_Y) / 2
  const grid = useMemo(() => {
    const texture = gridTexture()
    texture.repeat.set((FIELD.width + T * 2) / 2, pillarHeight / 2)
    return texture
  }, [pillarHeight])

  return (
    <group>
      {/* Panneau de fond */}
      <mesh position={[0, pillarY, PANEL_Z - PANEL_THICKNESS / 2]} receiveShadow>
        <boxGeometry args={[FIELD.width + T * 2, pillarHeight, PANEL_THICKNESS]} />
        <meshStandardMaterial map={grid} roughness={0.9} />
      </mesh>

      {/* Zone sombre sous la raquette, où la balle est perdue */}
      <mesh position={[0, (-HALF_H + GROUND_Y) / 2, PANEL_Z + 0.01]}>
        <boxGeometry args={[FIELD.width, -HALF_H - GROUND_Y, 0.02]} />
        <meshStandardMaterial color={COLORS.gutter} />
      </mesh>

      {/* Montants gauche et droit, traverse du haut */}
      <FramePiece position={[-HALF_W - T / 2, pillarY]} size={[T, pillarHeight]} neon="right" />
      <FramePiece position={[HALF_W + T / 2, pillarY]} size={[T, pillarHeight]} neon="left" />
      <FramePiece position={[0, HALF_H + T / 2]} size={[FIELD.width + T * 2, T]} neon="bottom" />
    </group>
  )
}

type Side = 'left' | 'right' | 'bottom'

function FramePiece({ position, size, neon }: { position: [number, number]; size: [number, number]; neon: Side }) {
  const [x, y] = position
  const [w, h] = size
  // Tube néon le long du bord intérieur, côté terrain
  const vertical = neon !== 'bottom'
  const tubeX = neon === 'left' ? -w / 2 + NEON / 2 : neon === 'right' ? w / 2 - NEON / 2 : 0
  const tubeY = neon === 'bottom' ? -h / 2 + NEON / 2 : 0
  return (
    <group position={[x, y, 0]}>
      <mesh position-z={FRAME_Z} castShadow receiveShadow>
        <boxGeometry args={[w, h, FRAME.depth]} />
        <meshStandardMaterial color={COLORS.frame} metalness={0.4} roughness={0.45} />
      </mesh>
      {/* Bandes claires en façade, pour le relief */}
      <mesh position-z={PANEL_Z + FRAME.depth + 0.02}>
        <boxGeometry args={vertical ? [w * 0.35, h, 0.04] : [w, h * 0.35, 0.04]} />
        <meshStandardMaterial color="#5a52a0" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[tubeX, tubeY, PANEL_Z + FRAME.depth - 0.1]}>
        <boxGeometry args={vertical ? [NEON, h, NEON] : [w, NEON, NEON]} />
        <meshStandardMaterial color={COLORS.neon} emissive={COLORS.neon} emissiveIntensity={2.5} />
      </mesh>
    </group>
  )
}
