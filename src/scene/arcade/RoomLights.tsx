import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { PointLight } from 'three'
import { world } from '../../game/world'
import { useGameEvents } from '../useGameEvents'
import { QUALITY } from '../quality'
import { ROOM, SCREEN_FRONT } from './layout'

const STRING_LIGHTS = [-2.2, -0.6, 1.0, 2.2].map((x) => ({ x, intensity: 0.8 }))
const STRING_LIGHTS_LIGHT = [-1.4, 1.4].map((x) => ({ x, intensity: 1.5 }))

// Éclairage de nuit, mais lisible : clair de lune par la fenêtre, lampe de bureau chaude,
// guirlande lumineuse, et la lueur de l'écran de la borne.
export function RoomLights() {
  const screenLight = useRef<PointLight>(null)
  // Surcroît de lueur quand l'écran s'illumine (casses, explosions) : la chambre réagit au jeu
  const boost = useRef(0)
  useGameEvents((event) => {
    if (event.type === 'brickDestroyed') {
      boost.current = Math.min(4, boost.current + (world.bricks[event.index].type === 'explosive' ? 3 : 0.5))
    } else if (event.type === 'levelCleared') boost.current = 4
  })

  // Léger scintillement de la lueur de l'écran, et retour progressif après un éclat
  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    boost.current = Math.max(0, boost.current - delta * 6)
    screenLight.current!.intensity = 2 + boost.current + Math.sin(t * 13) * 0.06 + Math.sin(t * 3.1) * 0.1
  })

  return (
    <>
      <hemisphereLight args={['#9aa4ff', '#3a2a48', 1.1]} />

      {/* Lune, depuis la fenêtre du fond */}
      <directionalLight
        castShadow
        position={[-2.2, 3.2, -2]}
        intensity={0.9}
        color="#a9bcff"
        shadow-mapSize={[QUALITY.shadowMapSize, QUALITY.shadowMapSize]}
        shadow-bias={-0.0004}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={12}
      />

      {/* Lumière d'ensemble venant de l'avant de la pièce, côté caméra */}
      <directionalLight position={[2, 2.5, 4]} intensity={0.45} color="#ffd9c2" />

      {/* Lampe de bureau */}
      <pointLight position={[1.97, 1.15, ROOM.backZ + 0.25]} color="#ffb36b" intensity={3.2} distance={5} decay={2} />

      {/* Guirlande : quelques sources chaudes le long du mur du fond (deux seulement sur mobile,
          plus intenses : chaque lumière alourdit le calcul de tous les matériaux) */}
      {(QUALITY.extraLights ? STRING_LIGHTS : STRING_LIGHTS_LIGHT).map(({ x, intensity }) => (
        <pointLight key={x} position={[x, 2.45, ROOM.backZ + 0.3]} color="#ffc98a" intensity={intensity} distance={3.5} decay={2} />
      ))}

      {/* Lueur de l'écran, et néon du fronton */}
      <pointLight ref={screenLight} position={SCREEN_FRONT} color="#8fa8ff" intensity={2} distance={3.5} decay={2} />
      <pointLight position={[0, 1.95, 0.6]} color="#ff5fd2" intensity={0.8} distance={2.5} decay={2} />
    </>
  )
}
