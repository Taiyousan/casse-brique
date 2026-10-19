import { useEffect } from 'react'
import { onGameEvent } from '../game/eventBus'
import { POWERUPS } from '../game/powerups'
import { type GameStatus, useGameStore } from '../game/store'
import { type GameEvent, world } from '../game/world'
import { audio, setCabinetMuffle, unlockAudio } from './engine'
import { startMusic, stopMusic } from './music'
import { useAudioSettings } from './settings'
import { sfx } from './sfx'

// Étouffement des sons de la borne selon l'endroit où se trouve la caméra, et musique
const MOOD: Record<GameStatus, { muffle: number; music: boolean }> = {
  menu: { muffle: 1, music: false },
  serving: { muffle: 0, music: true },
  playing: { muffle: 0, music: true },
  paused: { muffle: 0.55, music: false },
  levelComplete: { muffle: 0, music: false },
  gameover: { muffle: 0.4, music: false },
  victory: { muffle: 0.4, music: false },
}

// Fait sonner le jeu : bruitages sur les événements de la simulation, jingles sur les changements
// d'état, musique et étouffement des sons selon l'écran affiché.
export function AudioDirector() {
  useEffect(() => {
    const applyMood = (status: GameStatus) => {
      const mood = MOOD[status]
      setCabinetMuffle(mood.muffle)
      if (mood.music) startMusic()
      else stopMusic()
    }

    // Le son ne peut démarrer qu'après une première interaction
    const unlock = () => {
      if (audio()) return
      unlockAudio()
      applyMood(useGameStore.getState().status)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM') useAudioSettings.getState().toggleSound()
    }

    const offStore = useGameStore.subscribe((state, previous) => {
      if (state.status === previous.status) return
      applyMood(state.status)
      if (state.status === 'levelComplete') sfx.levelComplete()
      else if (state.status === 'gameover') sfx.gameOver()
      else if (state.status === 'victory') sfx.victory()
      else if (state.status === 'paused') sfx.pause()
      else if (previous.status === 'paused' && state.status !== 'menu') sfx.resume()
    })

    // Plusieurs briques détruites dans la même image (explosion en chaîne) : sons échelonnés
    let frameTime = -1
    let order = 0
    const onEvent = (event: GameEvent) => {
      const engine = audio()
      // La démo du menu joue en silence
      if (!engine || useGameStore.getState().status === 'menu') return
      if (engine.ctx.currentTime !== frameTime) {
        frameTime = engine.ctx.currentTime
        order = 0
      }
      playEvent(event, () => order++)
    }
    const offEvents = onGameEvent(onEvent)

    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      offStore()
      offEvents()
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return null
}

function playEvent(event: GameEvent, nextOrder: () => number) {
  switch (event.type) {
    case 'brickDestroyed':
      if (world.bricks[event.index].type === 'explosive') sfx.explosion(nextOrder())
      else sfx.brickBreak(event.combo, nextOrder())
      break
    case 'brickHit':
      if (world.bricks[event.index].type === 'steel') sfx.steel()
      else sfx.brickHit()
      break
    case 'paddleHit':
      sfx.paddle()
      break
    case 'wallHit':
      sfx.wall()
      break
    case 'launched':
      sfx.launch()
      break
    case 'laserFired':
      sfx.laser()
      break
    case 'powerUpCollected':
      if (event.kind === 'life') sfx.life()
      else sfx.powerUp(POWERUPS[event.kind].malus === true)
      break
    case 'ballLost':
      // Le son de vie perdue est joué sur allBallsLost : ici, seulement les balles du multi-balle
      if (world.balls.length > 0) sfx.ballDropped()
      break
    case 'allBallsLost':
      sfx.lifeLost()
      break
  }
}
