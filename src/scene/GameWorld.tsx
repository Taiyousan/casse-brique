import { useLayoutEffect, useMemo } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { COLORS, FIELD, FRAME } from '../game/constants'
import { BallTrails } from './BallTrails'
import { Balls } from './Balls'
import { Board } from './Board'
import { Bricks } from './Bricks'
import { GodFloor } from './GodFloor'
import { Lasers } from './Lasers'
import { Lights } from './Lights'
import { Paddle } from './Paddle'
import { Particles } from './Particles'
import { PowerUps } from './PowerUps'
import { ScorePopups } from './ScorePopups'
import { type HudBands, ScreenHud } from './ScreenHud'
import { ScreenFlash, ScreenShake } from './ScreenShake'

// Légère contre-plongée : la caméra est un peu sous le centre du panneau
const ELEVATION = MathUtils.degToRad(-6)

// Zone cadrée par la caméra, en unités du jeu : le terrain et son cadre,
// plus un bandeau en haut (score) et en bas (vies, effets) pour l'interface.
const HUD_TOP = 2.4
const HUD_BOTTOM = 1.8
const VIEW_TOP = FIELD.height / 2 + FRAME.thickness + HUD_TOP
const VIEW_BOTTOM = -FIELD.height / 2 - HUD_BOTTOM
const VIEW_HALF_WIDTH = FIELD.width / 2 + FRAME.thickness + 0.3
const VIEW_HEIGHT = VIEW_TOP - VIEW_BOTTOM
const TARGET = new Vector3(0, (VIEW_TOP + VIEW_BOTTOM) / 2, 0)

const BANDS: HudBands = { top: HUD_TOP / VIEW_HEIGHT, bottom: HUD_BOTTOM / VIEW_HEIGHT }

// Le jeu lui-même, tel qu'il s'affiche dans l'écran de la borne.
// Il est rendu dans une texture avec sa propre caméra (voir ArcadeScreen).
export function GameWorld({ camera }: { camera: PerspectiveCamera }) {
  // Position de repos de la caméra : la zone de jeu remplit l'écran, dont le format est fixe
  const rest = useMemo(() => {
    const vHalf = MathUtils.degToRad(camera.fov / 2)
    const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect)
    const distance = Math.max(VIEW_HALF_WIDTH / Math.tan(hHalf), VIEW_HEIGHT / 2 / Math.tan(vHalf))
    return new Vector3(TARGET.x, TARGET.y + Math.sin(ELEVATION) * distance, TARGET.z + Math.cos(ELEVATION) * distance)
  }, [camera])

  useLayoutEffect(() => {
    camera.position.copy(rest)
    camera.lookAt(TARGET)
    camera.updateProjectionMatrix()
  }, [camera, rest])

  return (
    <>
      <color attach="background" args={[COLORS.screenBackground]} />
      <Lights />
      <Board />
      <Bricks />
      <Paddle />
      <GodFloor />
      <BallTrails />
      <Balls />
      <PowerUps />
      <Lasers />
      <Particles />
      <ScorePopups />
      <ScreenShake camera={camera} rest={rest} />
      {/* La caméra rejoint la scène pour porter les calques collés devant elle */}
      <primitive object={camera}>
        <ScreenFlash />
        <ScreenHud camera={camera} bands={BANDS} />
      </primitive>
    </>
  )
}
