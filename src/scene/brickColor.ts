import { COLORS } from '../game/constants'
import type { BrickState } from '../game/world'

// Couleur affichée d'une brique, selon son type et sa résistance restante
export function brickColor(brick: BrickState) {
  switch (brick.type) {
    case 'strong':
      return COLORS.strong[Math.max(0, brick.hp - 1)]
    case 'steel':
      return COLORS.steel
    case 'explosive':
      return COLORS.explosive
    default:
      return brick.color
  }
}
