import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useReducer, useState } from 'react'
import { goToLevel } from '../game/actions'
import { isGodModeUrl, useCheats } from '../game/cheats'
import { LEVELS } from '../game/levels'
import { POWERUP_KINDS, POWERUPS, type PowerUpKind } from '../game/powerups'
import { applyPowerUp, clearLevel, endEffect } from '../game/simulation'
import { useGameStore } from '../game/store'
import { world } from '../game/world'

// Active ou désactive le god mode selon l'adresse (#godmode), y compris en cours de partie
export function useGodModeUrl() {
  useEffect(() => {
    const sync = () => useCheats.getState().setEnabled(isGodModeUrl())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
}

const SPEEDS = [0.25, 0.5, 1, 2]
const DROPS: { label: string; value: number | null }[] = [
  { label: 'Aucune', value: 0 },
  { label: 'Normale', value: null },
  { label: '50 %', value: 0.5 },
  { label: 'Toujours', value: 1 },
]

// Panneau de test : mort impossible, saut de niveau, bonus à volonté, vitesse du jeu…
export function GodModePanel() {
  const cheats = useCheats()
  const status = useGameStore((s) => s.status)
  const level = useGameStore((s) => s.level)
  const [open, setOpen] = useState(true)
  // Les effets en cours vivent dans la simulation : on rafraîchit le panneau régulièrement
  const [, refresh] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const timer = window.setInterval(refresh, 250)
    return () => window.clearInterval(timer)
  }, [])

  const inGame = status !== 'menu'
  const toggleEffect = (kind: PowerUpKind) => {
    if (world.effects[kind] !== undefined) endEffect(kind)
    else applyPowerUp(kind)
  }

  return (
    <aside className={open ? 'godmode' : 'godmode godmode-closed'}>
      <button className="godmode-title" onClick={blurAfter(() => setOpen(!open))} aria-expanded={open}>
        God mode <span>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="godmode-body">
          <Row label="Mort impossible">
            <Toggle on={cheats.invincible} onClick={() => cheats.update({ invincible: !cheats.invincible })} />
          </Row>
          <Row label="Bonus permanents">
            <Toggle on={cheats.frozenEffects} onClick={() => cheats.update({ frozenEffects: !cheats.frozenEffects })} />
          </Row>
          <Row label="Vitesse">
            {SPEEDS.map((speed) => (
              <Choice key={speed} on={cheats.timeScale === speed} onClick={() => cheats.update({ timeScale: speed })}>
                ×{speed}
              </Choice>
            ))}
          </Row>
          <Row label="Chute des bonus">
            {DROPS.map((drop) => (
              <Choice key={drop.label} on={cheats.dropChance === drop.value} onClick={() => cheats.update({ dropChance: drop.value })}>
                {drop.label}
              </Choice>
            ))}
          </Row>
          <Row label="Niveau">
            <Choice onClick={() => goToLevel(level - 1)} title="Niveau précédent">
              ◀
            </Choice>
            <span className="godmode-level">
              {level + 1}/{LEVELS.length}
            </span>
            <Choice onClick={() => goToLevel(level + 1)} title="Niveau suivant">
              ▶
            </Choice>
            <Choice onClick={clearLevel} disabled={status !== 'serving' && status !== 'playing'}>
              Terminer
            </Choice>
          </Row>
          <div className="godmode-label">Bonus {inGame ? '' : '(en partie)'}</div>
          <div className="godmode-bonus">
            {POWERUP_KINDS.map((kind) => {
              const def = POWERUPS[kind]
              const active = world.effects[kind] !== undefined
              return (
                <button
                  key={kind}
                  className={active ? 'godmode-capsule active' : 'godmode-capsule'}
                  style={{ '--capsule': def.color } as CSSProperties}
                  onClick={blurAfter(() => toggleEffect(kind))}
                  disabled={!inGame}
                  title={def.duration > 0 ? `${def.label} : activer / couper` : def.label}
                >
                  {def.letter}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </aside>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="godmode-row">
      <span className="godmode-label">{label}</span>
      <span className="godmode-controls">{children}</span>
    </div>
  )
}

// Le bouton rend le focus après le clic : sinon Espace (lancer la balle) le réactiverait
const blurAfter = (action: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
  e.currentTarget.blur()
  action()
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button className={on ? 'godmode-choice active' : 'godmode-choice'} aria-pressed={on} onClick={blurAfter(onClick)}>
      {on ? 'Oui' : 'Non'}
    </button>
  )
}

type ChoiceProps = { children: ReactNode; onClick: () => void; on?: boolean; disabled?: boolean; title?: string }

function Choice({ children, onClick, on = false, disabled = false, title }: ChoiceProps) {
  return (
    <button
      className={on ? 'godmode-choice active' : 'godmode-choice'}
      onClick={blurAfter(onClick)}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  )
}
