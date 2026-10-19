import { midi, noise, tone } from './synth'

// Bruitages du jeu, façon console 8 bits : ondes carrées et triangulaires, bruit filtré.

// Gamme pentatonique de do, sur deux octaves et demie : une série de briques joue une mélodie
const SCALE = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98, 100]

export const sfx = {
  // combo : rang de la brique dans la série ; order : rang dans la même image (explosions en chaîne)
  brickBreak(combo: number, order: number) {
    const note = SCALE[Math.min(Math.max(combo, 1), SCALE.length) - 1]
    const delay = order * 0.035
    tone({ freq: midi(note), duration: 0.1, volume: 0.09, delay })
    tone({ freq: midi(note + 12), duration: 0.05, type: 'triangle', volume: 0.05, delay })
  },

  // Brique résistante touchée sans casser
  brickHit() {
    tone({ freq: midi(64), duration: 0.06, volume: 0.07 })
    noise({ duration: 0.03, freq: 3000, filter: 'highpass', volume: 0.05 })
  },

  // Brique d'or : tintement métallique (deux sinus inharmoniques)
  steel() {
    tone({ freq: 1567, duration: 0.3, type: 'sine', volume: 0.06, slideTo: 1500 })
    tone({ freq: 2350, duration: 0.2, type: 'sine', volume: 0.035 })
  },

  explosion(order: number) {
    const delay = order * 0.04
    noise({ duration: 0.55, freq: 2400, sweepTo: 180, volume: 0.3, delay })
    tone({ freq: 110, slideTo: 38, duration: 0.45, type: 'sine', volume: 0.35, delay })
  },

  paddle() {
    tone({ freq: midi(57), slideTo: midi(64), duration: 0.07, volume: 0.1 })
    tone({ freq: midi(45), duration: 0.09, type: 'triangle', volume: 0.12 })
  },

  wall() {
    tone({ freq: midi(69), duration: 0.03, volume: 0.035 })
  },

  launch() {
    tone({ freq: midi(64), slideTo: midi(76), duration: 0.12, type: 'triangle', volume: 0.12 })
  },

  laser() {
    tone({ freq: 1400, slideTo: 380, duration: 0.08, volume: 0.03 })
  },

  // Arpège montant pour un bonus, descendant pour un malus
  powerUp(malus: boolean) {
    const notes = malus ? [67, 63, 60, 55] : [72, 76, 79, 84]
    notes.forEach((note, i) => tone({ freq: midi(note), duration: 0.08, volume: 0.08, delay: i * 0.055 }))
  },

  life() {
    ;[79, 83, 86, 91].forEach((note, i) => {
      tone({ freq: midi(note), duration: 0.1, volume: 0.08, delay: i * 0.07 })
      tone({ freq: midi(note - 12), duration: 0.1, type: 'triangle', volume: 0.06, delay: i * 0.07 })
    })
  },

  // Une balle parmi plusieurs tombe (multi-balle)
  ballDropped() {
    tone({ freq: midi(64), slideTo: midi(52), duration: 0.15, volume: 0.06 })
  },

  // Dernière balle perdue : une vie en moins
  lifeLost() {
    tone({ freq: midi(69), slideTo: midi(45), duration: 0.55, volume: 0.12 })
    tone({ freq: midi(57), slideTo: midi(33), duration: 0.6, type: 'triangle', volume: 0.12 })
    noise({ duration: 0.3, freq: 900, sweepTo: 200, volume: 0.08 })
  },

  levelComplete() {
    const melody: [number, number][] = [
      [72, 0],
      [76, 0.1],
      [79, 0.2],
      [84, 0.3],
      [79, 0.45],
      [84, 0.55],
    ]
    melody.forEach(([note, at]) => {
      tone({ freq: midi(note), duration: 0.14, volume: 0.09, delay: at })
      tone({ freq: midi(note - 24), duration: 0.14, type: 'triangle', volume: 0.1, delay: at })
    })
  },

  gameOver() {
    ;[67, 66, 65, 64].forEach((note, i) => tone({ freq: midi(note), duration: 0.32, volume: 0.09, delay: i * 0.3 }))
    tone({ freq: midi(40), duration: 1.0, type: 'triangle', volume: 0.14, delay: 1.2 })
  },

  victory() {
    const melody: [number, number, number][] = [
      [72, 0, 0.12],
      [72, 0.13, 0.12],
      [72, 0.26, 0.12],
      [79, 0.4, 0.3],
      [76, 0.72, 0.12],
      [79, 0.86, 0.12],
      [84, 1.0, 0.6],
    ]
    melody.forEach(([note, at, length]) => {
      tone({ freq: midi(note), duration: length, volume: 0.09, delay: at })
      tone({ freq: midi(note - 12), duration: length, type: 'triangle', volume: 0.08, delay: at })
    })
  },

  pause() {
    tone({ freq: midi(76), slideTo: midi(64), duration: 0.12, type: 'triangle', volume: 0.1 })
  },

  resume() {
    tone({ freq: midi(64), slideTo: midi(76), duration: 0.12, type: 'triangle', volume: 0.1 })
  },

  // Boutons de l'interface
  click() {
    tone({ freq: midi(84), duration: 0.04, volume: 0.05 })
  },
}
