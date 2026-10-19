import { PerformanceMonitor } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { AudioDirector } from './audio/AudioDirector'
import { useCheats } from './game/cheats'
import { GameScene } from './scene/GameScene'
import { QUALITY } from './scene/quality'
import { GodModePanel, useGodModeUrl } from './ui/GodModePanel'
import { PauseButton } from './ui/PauseButton'
import { Screens } from './ui/Screens'

const MAX_DPR = Math.min(window.devicePixelRatio, QUALITY.maxDpr)

export default function App() {
  useGodModeUrl()
  const godMode = useCheats((s) => s.enabled)
  // Résolution de rendu adaptée en continu : baissée si l'appareil peine, remontée s'il suit
  const [dpr, setDpr] = useState(MAX_DPR)

  return (
    <>
      <Canvas
        shadows="percentage"
        dpr={dpr}
        camera={{ fov: 45, near: 0.05, far: 50 }}
        // Exposition relevée : la chambre est de nuit, mais doit rester lisible
        onCreated={({ gl }) => {
          gl.toneMappingExposure = 1.35
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr((value) => Math.max(1, value - 0.25))}
          onIncline={() => setDpr((value) => Math.min(MAX_DPR, value + 0.25))}
          // Après plusieurs allers-retours, on se fixe sur la résolution la plus sûre
          flipflops={3}
          onFallback={() => setDpr(1)}
        />
        <GameScene />
      </Canvas>
      <PauseButton />
      <Screens />
      {godMode && <GodModePanel />}
      <AudioDirector />
    </>
  )
}
