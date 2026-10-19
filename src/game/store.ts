import { create } from 'zustand'
import { useCheats } from './cheats'
import { START_LIVES } from './constants'
import { MAX_LIVES, type PowerUpKind } from './powerups'
import { loadBest, saveBest } from './storage'

// État « lent » du jeu : ce qui change rarement et que l'interface affiche.
// Les effets en cours et leurs durées sont lus directement dans la simulation (world.effects).

export type GameStatus = 'menu' | 'serving' | 'playing' | 'paused' | 'levelComplete' | 'gameover' | 'victory'

// Statuts où la partie est en cours (et peut donc être mise en pause)
type ActiveStatus = 'serving' | 'playing'

type GameState = {
  status: GameStatus
  pausedFrom: ActiveStatus
  lives: number
  score: number
  best: number
  newRecord: boolean
  level: number // index du niveau en cours (0 = premier)
  levelIntro: number // incrémenté à chaque début de niveau, pour rejouer l'annonce du niveau
  multiplier: number
  // Dernier bonus ramassé, annoncé à l'écran. key change à chaque ramassage.
  toast: { kind: PowerUpKind; key: number } | null
  setStatus: (status: GameStatus) => void
  addScore: (points: number) => void
  setMultiplier: (multiplier: number) => void
  showToast: (kind: PowerUpKind) => void
  gainLife: () => void
  loseLife: () => void
  newGame: (level?: number) => void
  nextLevel: () => void
  jumpToLevel: (level: number) => void // god mode : saut direct, score et vies conservés
  win: () => void
  toMenu: () => void
  pause: () => void
  resume: () => void
}

export const isActive = (status: GameStatus): status is ActiveStatus =>
  status === 'serving' || status === 'playing'

// Fin de partie (défaite ou victoire) : enregistre le record s'il est battu.
// Une partie jouée en god mode ne compte pas.
function finish(s: GameState, status: 'gameover' | 'victory'): Partial<GameState> {
  const newRecord = s.score > s.best && !useCheats.getState().enabled
  if (newRecord) saveBest(s.score)
  return { status, multiplier: 1, toast: null, newRecord, best: newRecord ? s.score : s.best }
}

export const useGameStore = create<GameState>()((set) => ({
  status: 'menu',
  pausedFrom: 'serving',
  lives: START_LIVES,
  score: 0,
  best: loadBest(),
  newRecord: false,
  level: 0,
  levelIntro: 0,
  multiplier: 1,
  toast: null,
  setStatus: (status) => set({ status }),
  addScore: (points) => set((s) => ({ score: s.score + points })),
  setMultiplier: (multiplier) => set({ multiplier }),
  showToast: (kind) => set((s) => ({ toast: { kind, key: (s.toast?.key ?? 0) + 1 } })),
  gainLife: () => set((s) => ({ lives: Math.min(MAX_LIVES, s.lives + 1) })),
  loseLife: () =>
    set((s) =>
      s.lives > 1
        ? { lives: s.lives - 1, status: 'serving', multiplier: 1, toast: null }
        : { lives: 0, ...finish(s, 'gameover') },
    ),
  newGame: (level = 0) =>
    set((s) => ({
      status: 'serving',
      lives: START_LIVES,
      score: 0,
      level,
      levelIntro: s.levelIntro + 1,
      multiplier: 1,
      toast: null,
      newRecord: false,
    })),
  nextLevel: () =>
    set((s) => ({ status: 'serving', level: s.level + 1, levelIntro: s.levelIntro + 1, multiplier: 1, toast: null })),
  jumpToLevel: (level) =>
    set((s) => ({ status: 'serving', level, levelIntro: s.levelIntro + 1, multiplier: 1, toast: null })),
  win: () => set((s) => finish(s, 'victory')),
  toMenu: () => set({ status: 'menu', multiplier: 1, toast: null }),
  pause: () => set((s) => (isActive(s.status) ? { status: 'paused', pausedFrom: s.status } : {})),
  resume: () => set((s) => (s.status === 'paused' ? { status: s.pausedFrom } : {})),
}))
