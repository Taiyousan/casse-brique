import { LEVELS } from './levels'
import { useGameStore } from './store'
import { loadLevel, resetWorld, serveBall } from './world'

// Actions déclenchées par l'interface : elles mettent à jour à la fois la simulation et le store.

// Pour tester un niveau directement : ?niveau=5 dans l'URL (numérotation à partir de 1)
function startLevelFromUrl() {
  const param = Number(new URLSearchParams(window.location.search).get('niveau'))
  return Number.isInteger(param) && param >= 1 && param <= LEVELS.length ? param - 1 : 0
}

export function startGame() {
  const level = startLevelFromUrl()
  resetWorld(level)
  useGameStore.getState().newGame(level)
}

export function backToMenu() {
  resetWorld()
  useGameStore.getState().toMenu()
}

export function nextLevel() {
  const store = useGameStore.getState()
  store.nextLevel()
  loadLevel(store.level + 1)
  serveBall()
}

// God mode : aller directement à un niveau. Depuis le menu, démarre une partie à ce niveau ;
// en cours de partie, garde le score et les vies.
export function goToLevel(level: number) {
  const index = (level + LEVELS.length) % LEVELS.length
  const store = useGameStore.getState()
  if (store.status === 'menu') {
    resetWorld(index)
    store.newGame(index)
    return
  }
  store.jumpToLevel(index)
  loadLevel(index)
  serveBall()
}
