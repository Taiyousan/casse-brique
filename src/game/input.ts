// Clavier et demande de lancement. La position de la souris ou du doigt est lue
// directement dans la boucle de jeu, à partir du pointeur de R3F.

const pressed = new Set<string>()
let launchRequested = false

// e.code désigne la touche physique : KeyA correspond aussi au Q d'un clavier AZERTY
const LEFT = ['ArrowLeft', 'KeyA']
const RIGHT = ['ArrowRight', 'KeyD']

export function attachInput() {
  const onKeyDown = (e: KeyboardEvent) => {
    pressed.add(e.code)
    // Sur un bouton de l'interface, Espace garde son rôle normal (activer le bouton)
    if (e.code === 'Space' && !(e.target instanceof HTMLButtonElement)) {
      e.preventDefault()
      if (!e.repeat) launchRequested = true
    }
  }
  const onKeyUp = (e: KeyboardEvent) => pressed.delete(e.code)
  const onPointerDown = (e: PointerEvent) => {
    // Seuls les clics sur la scène lancent la balle, pas ceux sur les boutons de l'interface
    if (e.button === 0 && e.target instanceof HTMLCanvasElement) launchRequested = true
  }
  // Évite une touche « bloquée » si la fenêtre perd le focus pendant l'appui
  const onBlur = () => pressed.clear()

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('blur', onBlur)
  return () => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('pointerdown', onPointerDown)
    window.removeEventListener('blur', onBlur)
  }
}

export function keyDirection() {
  const left = LEFT.some((code) => pressed.has(code))
  const right = RIGHT.some((code) => pressed.has(code))
  return (right ? 1 : 0) - (left ? 1 : 0)
}

// Renvoie true une seule fois par demande
export function consumeLaunch() {
  const requested = launchRequested
  launchRequested = false
  return requested
}
