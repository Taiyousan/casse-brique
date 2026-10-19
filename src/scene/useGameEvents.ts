import { useEffect, useRef } from 'react'
import { onGameEvent } from '../game/eventBus'
import type { GameEvent } from '../game/world'

// Abonne un composant aux événements de la simulation pendant toute sa durée de vie.
// La fonction la plus récente est toujours appelée, sans réabonnement à chaque rendu.
export function useGameEvents(listener: (event: GameEvent) => void) {
  const latest = useRef(listener)
  latest.current = listener
  useEffect(() => onGameEvent((event) => latest.current(event)), [])
}
