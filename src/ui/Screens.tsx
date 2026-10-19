import { type CSSProperties, type ReactNode, useEffect } from 'react'
import { useAudioSettings } from '../audio/settings'
import { sfx } from '../audio/sfx'
import { backToMenu, nextLevel, startGame } from '../game/actions'
import { LEVELS } from '../game/levels'
import { POWERUP_KINDS, POWERUPS } from '../game/powerups'
import { isActive, useGameStore } from '../game/store'
import { formatScore, isTouch } from './format'

// Écrans superposés à la scène : accueil, pause, fin de niveau, fin de partie.
export function Screens() {
  const status = useGameStore((s) => s.status)
  usePauseControls()

  switch (status) {
    case 'menu':
      return <MenuScreen />
    case 'paused':
      return <PauseScreen />
    case 'levelComplete':
      return <LevelCompleteScreen />
    case 'gameover':
      return <EndScreen title="Partie terminée" />
    case 'victory':
      return <EndScreen title="Victoire !" subtitle="Tous les niveaux sont terminés" />
    default:
      return null
  }
}

// Échap, P ou clic droit pour basculer la pause ; pause automatique si la page passe en arrière-plan.
function usePauseControls() {
  useEffect(() => {
    const togglePause = () => {
      const { status, pause, resume } = useGameStore.getState()
      if (isActive(status)) pause()
      else if (status === 'paused') resume()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyP') togglePause()
    }
    // Souris uniquement : au tactile, un appui long déclenche aussi un « clic droit »
    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2 && e.pointerType === 'mouse') togglePause()
    }
    // Pas de menu contextuel du navigateur par-dessus le jeu
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    const autoPause = () => useGameStore.getState().pause()
    const onVisibility = () => document.hidden && autoPause()

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('blur', autoPause)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('blur', autoPause)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])
}

type PanelProps = {
  children: ReactNode
  delayed?: boolean // laisse le temps de voir la fin du niveau avant d'afficher l'écran
  side?: boolean // panneau sur le côté, sans voile sur la scène
  wide?: boolean
}

function Panel({ children, delayed = false, side = false, wide = false }: PanelProps) {
  const className = ['screen', delayed && 'screen-delayed', side && 'screen-side'].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <div className={wide ? 'panel panel-wide' : 'panel'}>{children}</div>
    </div>
  )
}

function Button({ children, onClick, primary = false }: { children: ReactNode; onClick: () => void; primary?: boolean }) {
  const handleClick = () => {
    sfx.click()
    onClick()
  }
  return (
    <button className={primary ? 'button button-primary' : 'button'} onClick={handleClick} autoFocus={primary}>
      {children}
    </button>
  )
}

// Réglages du son : tout couper, ou seulement la musique
function AudioToggles() {
  const { sound, music, toggleSound, toggleMusic } = useAudioSettings()
  const toggle = (action: () => void) => () => {
    action()
    sfx.click()
  }
  return (
    <div className="toggles">
      <button className="toggle" aria-pressed={sound} onClick={toggle(toggleSound)}>
        Son <span>{sound ? 'oui' : 'non'}</span>
      </button>
      <button className="toggle" aria-pressed={music && sound} disabled={!sound} onClick={toggle(toggleMusic)}>
        Musique <span>{music ? 'oui' : 'non'}</span>
      </button>
    </div>
  )
}

function MenuScreen() {
  const best = useGameStore((s) => s.best)
  return (
    <Panel side>
      <h1 className="title">
        Casse
        <br />
        brique
      </h1>
      {best > 0 && <p className="panel-stat">Record {formatScore(best)}</p>}
      <Button primary onClick={startGame}>
        Jouer
      </Button>
      <AudioToggles />
      <ul className="controls">
        {isTouch ? (
          <>
            <li>Glissez le doigt pour déplacer la raquette</li>
            <li>Touchez l'écran pour lancer la balle</li>
          </>
        ) : (
          <>
            <li>
              <kbd>Souris</kbd> ou <kbd>←</kbd> <kbd>→</kbd> déplacer
            </li>
            <li>
              <kbd>Clic</kbd> ou <kbd>Espace</kbd> lancer la balle
            </li>
            <li>
              <kbd>Échap</kbd> ou <kbd>Clic droit</kbd> pause
            </li>
            <li>
              <kbd>M</kbd> couper le son
            </li>
          </>
        )}
      </ul>
    </Panel>
  )
}

function PauseScreen() {
  const resume = useGameStore((s) => s.resume)
  return (
    <Panel wide>
      <h2>Pause</h2>
      <Button primary onClick={resume}>
        Reprendre
      </Button>
      <Button onClick={startGame}>Recommencer</Button>
      <Button onClick={backToMenu}>Menu</Button>
      <AudioToggles />
      <BonusInset />
    </Panel>
  )
}

// Encart récapitulatif des capsules : lettre, couleur et nom, malus signalés en rose
function BonusInset() {
  return (
    <section className="bonus-inset" aria-label="Bonus">
      <h3>Bonus</h3>
      <ul>
        {POWERUP_KINDS.map((kind) => {
          const def = POWERUPS[kind]
          return (
            <li key={kind} className={def.malus ? 'malus' : undefined}>
              <span className="capsule" style={{ '--capsule': def.color } as CSSProperties}>
                {def.letter}
              </span>
              {def.label}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function LevelCompleteScreen() {
  const level = useGameStore((s) => s.level)
  const score = useGameStore((s) => s.score)
  return (
    <Panel delayed>
      <h2>Niveau {level + 1} terminé</h2>
      <p className="panel-stat">Score {formatScore(score)}</p>
      <p className="panel-next">
        Prochain niveau : <strong>{level + 2}</strong> / {LEVELS.length}
      </p>
      <Button primary onClick={nextLevel}>
        Continuer
      </Button>
    </Panel>
  )
}

function EndScreen({ title, subtitle }: { title: string; subtitle?: string }) {
  const score = useGameStore((s) => s.score)
  const best = useGameStore((s) => s.best)
  const newRecord = useGameStore((s) => s.newRecord)
  return (
    <Panel delayed>
      <h2>{title}</h2>
      {subtitle && <p className="panel-stat">{subtitle}</p>}
      <p className="panel-score">{formatScore(score)}</p>
      {newRecord ? (
        <p className="panel-record">Nouveau record !</p>
      ) : (
        <p className="panel-stat">Record {formatScore(best)}</p>
      )}
      <Button primary onClick={startGame}>
        Rejouer
      </Button>
      <Button onClick={backToMenu}>Menu</Button>
    </Panel>
  )
}
