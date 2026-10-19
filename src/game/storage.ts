// Meilleur score, conservé dans le navigateur. Le stockage peut être indisponible
// (navigation privée, cookies bloqués) : le jeu fonctionne alors sans record enregistré.
const BEST_KEY = 'casse-brique:best'

export function loadBest(): number {
  try {
    const value = Number(localStorage.getItem(BEST_KEY))
    return Number.isFinite(value) ? value : 0
  } catch {
    return 0
  }
}

export function saveBest(score: number) {
  try {
    localStorage.setItem(BEST_KEY, String(score))
  } catch {
    // Ignoré : le record restera valable jusqu'à la fermeture de la page
  }
}
