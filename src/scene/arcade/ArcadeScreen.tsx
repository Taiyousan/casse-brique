import { useFBO } from '@react-three/drei'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { type Mesh, PerspectiveCamera, Scene } from 'three'
import { useGameStore } from '../../game/store'
import { GameWorld } from '../GameWorld'
import { warmUp } from '../warmUp'
import { createCrtMaterial } from './crtMaterial'
import { SCREEN, SCREEN_TEXTURE } from './layout'
import { screenLink } from './screenPointer'

// Écran de la borne : le jeu est rendu dans une texture hors écran,
// puis affiché sur la dalle avec un shader qui imite un tube cathodique.
export function ArcadeScreen() {
  const fbo = useFBO(SCREEN_TEXTURE.width, SCREEN_TEXTURE.height, { samples: 4 })
  const gameScene = useMemo(() => new Scene(), [])
  const gameCamera = useMemo(() => new PerspectiveCamera(40, SCREEN.width / SCREEN.height, 0.1, 200), [])
  const material = useMemo(() => createCrtMaterial(fbo.texture), [fbo])
  const mesh = useRef<Mesh>(null)
  const gl = useThree((s) => s.gl)
  const frozen = useRef(false)

  useLayoutEffect(() => {
    screenLink.mesh = mesh.current
    screenLink.gameCamera = gameCamera
    return () => {
      screenLink.mesh = null
      screenLink.gameCamera = null
    }
  }, [gameCamera])

  // Le jeu est monté dans sa scène : on compile tous ses shaders d'un coup
  useEffect(() => warmUp(gl, gameScene, gameCamera), [gl, gameScene, gameCamera])

  // Priorité positive : ce composant prend en charge le rendu de chaque image.
  // D'abord le jeu dans sa texture, puis la pièce (qui affiche cette texture sur l'écran).
  // En pause, l'image du jeu est figée : on ne la redessine qu'une fois, puis on réutilise la texture.
  useFrame(({ gl, scene, camera, clock }) => {
    material.uniforms.time.value = clock.elapsedTime
    const paused = useGameStore.getState().status === 'paused'
    if (!paused || !frozen.current) {
      gl.setRenderTarget(fbo)
      gl.render(gameScene, gameCamera)
      gl.setRenderTarget(null)
    }
    frozen.current = paused
    gl.render(scene, camera)
  }, 1)

  return (
    <>
      {createPortal(<GameWorld camera={gameCamera} />, gameScene, { camera: gameCamera })}
      <mesh ref={mesh} material={material}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
      </mesh>
    </>
  )
}
