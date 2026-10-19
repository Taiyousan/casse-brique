import type { GameEvent } from './world'

// Rediffuse les événements de la simulation aux effets visuels et sonores,
// qui y réagissent sans toucher à la logique du jeu.

type Listener = (event: GameEvent) => void

const listeners = new Set<Listener>()

export function onGameEvent(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function dispatchGameEvents(events: readonly GameEvent[]) {
  for (const event of events) for (const listener of listeners) listener(event)
}
