import { create } from 'zustand'

// God mode : réglages de test, accessibles en ajoutant #godmode à l'adresse de la page.
// Sans #godmode, la simulation utilise toujours les valeurs normales.

export type CheatSettings = {
  invincible: boolean // la balle rebondit au fond au lieu d'être perdue
  frozenEffects: boolean // les effets en cours ne s'écoulent plus
  dropChance: number | null // probabilité de chute d'une capsule (null = normale)
  timeScale: number // vitesse d'écoulement du jeu
}

const DEFAULTS: CheatSettings = { invincible: false, frozenEffects: false, dropChance: null, timeScale: 1 }

// Garde-fou pour les tests de simulation, qui tournent sans navigateur
export const isGodModeUrl = () => typeof window !== 'undefined' && window.location.hash.toLowerCase() === '#godmode'

type CheatState = CheatSettings & {
  enabled: boolean
  update: (patch: Partial<CheatSettings>) => void
  setEnabled: (enabled: boolean) => void
}

export const useCheats = create<CheatState>()((set) => ({
  ...DEFAULTS,
  enabled: isGodModeUrl(),
  update: (patch) => set(patch),
  // En quittant le god mode, tout revient à la normale
  setEnabled: (enabled) => set(enabled ? { enabled } : { enabled, ...DEFAULTS }),
}))

// Réglages effectifs, lus par la simulation à chaque pas
export function activeCheats(): CheatSettings {
  const state = useCheats.getState()
  return state.enabled ? state : DEFAULTS
}
