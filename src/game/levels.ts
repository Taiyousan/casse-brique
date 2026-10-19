import { BRICKS, COLORS, FIELD } from './constants'
import type { BrickState, BrickType } from './world'

// Un niveau est une grille de 12 caractères par ligne :
//   .            vide
//   r o y g b p  brique normale (couleur)
//   2 3          brique résistante (2 ou 3 coups)
//   #            brique indestructible
//   *            brique explosive (détruit ses voisines)
export const LEVELS: string[][] = [
  [
    '............',
    'rrrrrrrrrrrr',
    'oooooooooooo',
    'yyyyyyyyyyyy',
    'gggggggggggg',
    'bbbbbbbbbbbb',
  ],
  // Pyramide
  [
    '.....rr.....',
    '....oooo....',
    '...yyyyyy...',
    '..gggggggg..',
    '.bbbbbbbbbb.',
    'pppppppppppp',
    '222222222222',
  ],
  // Damier
  [
    'r.r.r.r.r.r.',
    '.o.o.o.o.o.o',
    'y.y.y.y.y.y.',
    '.g.g.g.g.g.g',
    'b.b.b.b.b.b.',
    '.p.p.p.p.p.p',
    '2.2.2.2.2.2.',
    '.2.2.2.2.2.2',
  ],
  // Explosives en quinconce
  [
    'pppppppppppp',
    'p*pp*pp*pp*p',
    'pppppppppppp',
    'bbbbbbbbbbbb',
    'b*bb*bb*bb*b',
    'bbbbbbbbbbbb',
    'gggggggggggg',
  ],
  // Envahisseur
  [
    '..g......g..',
    '...g....g...',
    '..gggggggg..',
    '.gg*gggg*gg.',
    'gggggggggggg',
    'g.gggggggg.g',
    'g.g......g.g',
    '...22..22...',
  ],
  // Couloirs entre des colonnes indestructibles
  [
    '333333333333',
    'r#rr#rr#rr#r',
    'o#oo#oo#oo#o',
    'y#yy#yy#yy#y',
    'g#gg#gg#gg#g',
    'b.bb.bb.bb.b',
    'p.pp.pp.pp.p',
  ],
  // Forteresse : un cœur protégé, une seule entrée par le bas
  [
    '#3333333333#',
    '#3yyyyyyyy3#',
    '#3y*oooo*y3#',
    '#3yyyyyyyy3#',
    '#3333333333#',
    '#..........#',
    '####....####',
  ],
  // Grand cœur
  [
    '..33....33..',
    '.3rr3..3rr3.',
    '3rrrr33rrrr3',
    '3rrrrrrrrrr3',
    '3rrrr**rrrr3',
    '.3rrrrrrrr3.',
    '..3rrrrrr3..',
    '...3rrrr3...',
    '....3rr3....',
    '.....33.....',
  ],
]

function brickFromChar(char: string): { type: BrickType; hp: number; color: string } | null {
  if (char in COLORS.bricks) return { type: 'normal', hp: 1, color: COLORS.bricks[char] }
  if (char === '2' || char === '3') return { type: 'strong', hp: Number(char), color: '' }
  if (char === '#') return { type: 'steel', hp: Infinity, color: COLORS.steel }
  if (char === '*') return { type: 'explosive', hp: 1, color: COLORS.explosive }
  return null
}

// Décalage d'apparition de chaque brique, pour l'animation d'entrée en cascade
const ROW_DELAY = 0.06
const COLUMN_DELAY = 0.025

// startTime : instant (world.time) où la première brique commence à tomber
export function parseLevel(rows: string[], startTime: number): BrickState[] {
  const bricks: BrickState[] = []
  rows.slice(0, BRICKS.maxRows).forEach((row, r) => {
    for (let c = 0; c < BRICKS.columns; c++) {
      const def = brickFromChar(row[c] ?? '.')
      if (!def) continue
      bricks.push({
        ...def,
        maxHp: def.hp,
        x: -FIELD.width / 2 + BRICKS.cellWidth * (c + 0.5),
        y: BRICKS.topY - BRICKS.cellHeight * (r + 0.5),
        alive: true,
        spawnAt: startTime + r * ROW_DELAY + c * COLUMN_DELAY,
        hitAt: -Infinity,
        destroyedAt: -Infinity,
      })
    }
  })
  return bricks
}
