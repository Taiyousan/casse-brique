export const formatScore = (score: number) => score.toLocaleString('fr-FR')

// Écran tactile comme pointeur principal (téléphone, tablette)
export const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
