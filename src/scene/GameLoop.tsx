import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector2 } from 'three'
import { activeCheats } from '../game/cheats'
import { createDemo, handleDemoEvents, stepDemo } from '../game/demo'
import { dispatchGameEvents } from '../game/eventBus'
import { attachInput, consumeLaunch, keyDirection } from '../game/input'
import { LEVELS } from '../game/levels'
import { STEP, step } from '../game/simulation'
import { isActive, useGameStore } from '../game/store'
import { clearTransient, resetWorld, serveBall, world } from '../game/world'
import { pointerToGameX } from './arcade/screenPointer'

// Au-delà, on considère que l'onglet était en arrière-plan : on ne rattrape pas tout ce temps
const MAX_FRAME_TIME = 0.1
// Durée du micro-arrêt après une explosion, en secondes
const HIT_STOP = 0.06

// Fait avancer la simulation et relaie ses événements vers le store.
export function GameLoop() {
  const accumulator = useRef(0)
  const lastPointer = useRef(new Vector2())
  const hitStop = useRef(0)
  const demo = useRef(createDemo())

  useEffect(() => {
    resetWorld()
    return attachInput()
  }, [])

  // Priorité négative : la simulation tourne avant les composants qui affichent son état
  useFrame((state, delta) => {
    // Le god mode peut ralentir ou accélérer tout le jeu
    const frameTime = Math.min(delta, MAX_FRAME_TIME) * activeCheats().timeScale
    // Toujours consommée, pour qu'un clic fait dans un menu ne lance pas la balle plus tard
    let launch = consumeLaunch()

    const store = useGameStore.getState()
    // Pause : tout est figé, animations comprises
    if (store.status === 'paused') {
      accumulator.current = 0
      return
    }
    // Menu : l'écran de la borne joue une démo. Ses événements alimentent les effets visuels,
    // mais pas le score ni l'interface.
    if (store.status === 'menu') {
      accumulator.current += frameTime
      while (accumulator.current >= STEP) {
        stepDemo(demo.current, STEP)
        accumulator.current -= STEP
      }
      dispatchGameEvents(world.events)
      handleDemoEvents(demo.current)
      world.events.length = 0
      return
    }

    // La raquette suit la souris ou le doigt, projetés à travers l'écran de la borne jusque dans le jeu.
    // Seulement quand le pointeur bouge : sinon la raquette dériverait pendant les mouvements de caméra.
    if (!state.pointer.equals(lastPointer.current)) {
      lastPointer.current.copy(state.pointer)
      const x = pointerToGameX(state.pointer, state.camera)
      if (x !== null) world.paddle.targetX = x
    }

    // Écrans de fin : la simulation est à l'arrêt, mais le temps avance pour finir les animations
    if (store.status === 'levelComplete' || store.status === 'gameover' || store.status === 'victory') {
      world.time += frameTime
      return
    }

    // Micro-arrêt après une explosion : tout se fige un instant, pour donner du poids à l'impact
    if (hitStop.current > 0) {
      hitStop.current -= frameTime
      return
    }

    accumulator.current += frameTime
    while (accumulator.current >= STEP) {
      step(STEP, { keyDirection: keyDirection(), launch })
      launch = false
      accumulator.current -= STEP
    }

    // Les effets (particules, tremblements, sons…) réagissent avant que les événements soient vidés
    dispatchGameEvents(world.events)

    for (const event of world.events) {
      switch (event.type) {
        case 'launched':
          store.setStatus('playing')
          break
        case 'paddleHit':
          store.setMultiplier(1)
          break
        case 'brickDestroyed':
          store.addScore(event.points)
          store.setMultiplier(event.multiplier)
          if (world.bricks[event.index].type === 'explosive') hitStop.current = HIT_STOP
          break
        case 'powerUpCollected':
          // Ignoré si la manche vient de se terminer dans la même image
          if (isActive(useGameStore.getState().status)) store.showToast(event.kind)
          break
        case 'lifeGained':
          store.gainLife()
          break
        case 'levelCleared':
          world.balls = []
          clearTransient()
          if (store.level >= LEVELS.length - 1) store.win()
          else store.setStatus('levelComplete')
          break
        case 'allBallsLost':
          // Ignoré si le niveau vient d'être terminé dans la même image
          if (useGameStore.getState().status !== 'playing') break
          store.loseLife()
          if (useGameStore.getState().status === 'serving') serveBall()
          else clearTransient()
          break
      }
    }
    world.events.length = 0
  }, -1)

  return null
}
