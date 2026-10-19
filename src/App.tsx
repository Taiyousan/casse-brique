import { Canvas } from '@react-three/fiber'
import { AudioDirector } from './audio/AudioDirector'
import { useCheats } from './game/cheats'
import { GameScene } from './scene/GameScene'
import { GodModePanel, useGodModeUrl } from './ui/GodModePanel'
import { PauseButton } from './ui/PauseButton'
import { Screens } from './ui/Screens'

export default function App() {
  useGodModeUrl()
  const godMode = useCheats((s) => s.enabled)

  return (
    <>
      <Canvas
        shadows="percentage"
        dpr={[1, 2]}
        camera={{ fov: 45, near: 0.05, far: 50 }}
        // Exposition relevée : la chambre est de nuit, mais doit rester lisible
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.35
        }}
      >
        <GameScene />
      </Canvas>
      <PauseButton />
      <Screens />
      {godMode && <GodModePanel />}
      <AudioDirector />
    </>
  )
}
