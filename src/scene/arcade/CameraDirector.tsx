import { useFrame, useThree } from '@react-three/fiber'
import { useRef } from 'react'
import { MathUtils, type PerspectiveCamera, Vector3 } from 'three'
import { type GameStatus, useGameStore } from '../../game/store'
import { SCREEN, SCREEN_NORMAL } from './layout'

type Pose = { position: Vector3; target: Vector3 }

// Vue de la pièce (menu) : de trois quarts, depuis le coin droit de la chambre
const ROOM_TARGET = new Vector3(-0.15, 1.05, 0.1)
const ROOM_DIRECTION = new Vector3(0.75, 0.32, 1).normalize()
const ROOM_FRAME = { width: 2.6, height: 2.1 } // zone à garder dans le cadre
const ROOM_PORTRAIT_FRAME = { width: 1.25, height: 2.1 }

// Recul devant l'écran selon l'état : 1 = l'écran remplit la vue
const SCREEN_DISTANCE: Partial<Record<GameStatus, number>> = {
  paused: 2.2,
  gameover: 3.2,
  victory: 3.2,
}

// Vitesse de rapprochement vers la pose visée (plus grand = plus rapide)
const DAMPING = 2.6

// Place la caméra de la pièce selon l'état du jeu, avec des transitions amorties :
// vue de la chambre au menu, plongée dans l'écran pendant la partie, recul à la pause.
export function CameraDirector() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const current = useRef<Pose | null>(null)
  const goal = useRef<Pose>({ position: new Vector3(), target: new Vector3() })

  useFrame((state, delta) => {
    const status = useGameStore.getState().status
    const aspect = state.size.width / state.size.height
    const pose = goal.current

    if (status === 'menu') {
      roomPose(camera.fov, aspect, pose)
      // Lent balancement, pour que la pièce vive pendant le menu
      const t = state.clock.elapsedTime
      pose.position.x += Math.sin(t * 0.25) * 0.15
      pose.position.y += Math.sin(t * 0.4) * 0.04
    } else {
      screenPose(camera.fov, aspect, SCREEN_DISTANCE[status] ?? 1, pose)
    }

    // Première image : on se place directement, sans transition
    if (!current.current) {
      current.current = { position: pose.position.clone(), target: pose.target.clone() }
    }
    const k = 1 - Math.exp(-DAMPING * Math.min(delta, 0.1))
    current.current.position.lerp(pose.position, k)
    current.current.target.lerp(pose.target, k)

    camera.position.copy(current.current.position)
    camera.lookAt(current.current.target)
  }, 0)

  return null
}

// Distance à laquelle une zone (largeur × hauteur) remplit exactement la vue
function fitDistance(fov: number, aspect: number, width: number, height: number) {
  const vHalf = MathUtils.degToRad(fov / 2)
  const hHalf = Math.atan(Math.tan(vHalf) * aspect)
  return Math.max(height / 2 / Math.tan(vHalf), width / 2 / Math.tan(hHalf))
}

function roomPose(fov: number, aspect: number, out: Pose) {
  // En portrait (mobile), on cadre surtout la borne, et on vise plus bas
  // pour qu'elle apparaisse dans la moitié haute, au-dessus du menu
  const portrait = aspect < 1
  const width = portrait ? ROOM_PORTRAIT_FRAME.width : ROOM_FRAME.width
  const height = portrait ? ROOM_PORTRAIT_FRAME.height : ROOM_FRAME.height
  const distance = fitDistance(fov, aspect, width, height)
  out.target.copy(ROOM_TARGET)
  if (portrait) out.target.y -= 0.45
  out.position.copy(ROOM_TARGET).addScaledVector(ROOM_DIRECTION, distance)
}

// Face à l'écran, dans l'axe de sa normale. Une petite marge garde le cadre de l'écran visible.
function screenPose(fov: number, aspect: number, factor: number, out: Pose) {
  const distance = fitDistance(fov, aspect, SCREEN.width * 1.04, SCREEN.height * 1.04) * factor
  out.target.copy(SCREEN.center)
  out.position.copy(SCREEN.center).addScaledVector(SCREEN_NORMAL, distance)
  // En reculant, la caméra monte un peu pour montrer le haut de la borne
  out.position.y += (factor - 1) * 0.08
}
