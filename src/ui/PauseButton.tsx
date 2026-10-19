import type { MouseEvent } from 'react'
import { isActive, useGameStore } from '../game/store'

// Bouton pause, surtout utile au tactile (au clavier : Échap, à la souris : clic droit).
// Le reste de l'interface de jeu est affiché dans l'écran de la borne (voir ScreenHud).
export function PauseButton() {
  const visible = useGameStore((s) => isActive(s.status))
  const pause = useGameStore((s) => s.pause)
  if (!visible) return null

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    // Sinon le bouton garde le focus, et la touche Espace (lancer) le réactiverait
    e.currentTarget.blur()
    pause()
  }

  return (
    <button className="pause-button" onClick={onClick} aria-label="Pause">
      <span />
      <span />
    </button>
  )
}
