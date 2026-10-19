import { audio } from './engine'
import { midi, noise, tone } from './synth'

// Boucle chiptune de quatre mesures (la mineur, fa, do, sol), jouée pendant la partie.
// Les notes sont programmées un peu à l'avance sur l'horloge audio, pour un tempo stable.

const BPM = 128
const SIXTEENTH = 60 / BPM / 4
const STEPS = 64 // 4 mesures de 16 doubles croches
const LOOKAHEAD = 0.12 // secondes programmées à l'avance

// Par mesure : basse (MIDI) et notes de l'arpège
const BARS = [
  { bass: 45, arp: [69, 72, 76] },
  { bass: 41, arp: [65, 69, 72] },
  { bass: 48, arp: [67, 72, 76] },
  { bass: 43, arp: [67, 71, 74] },
]

let timer: number | null = null
let nextTime = 0
let step = 0

export function startMusic() {
  const engine = audio()
  if (!engine || timer !== null) return
  nextTime = engine.ctx.currentTime + 0.05
  timer = window.setInterval(schedule, 25)
}

export function stopMusic() {
  if (timer === null) return
  window.clearInterval(timer)
  timer = null
}

function schedule() {
  const engine = audio()
  if (!engine) return
  // Rattrapage après une longue interruption (onglet en arrière-plan) : on repart de maintenant
  if (nextTime < engine.ctx.currentTime - 0.2) nextTime = engine.ctx.currentTime + 0.05
  while (nextTime < engine.ctx.currentTime + LOOKAHEAD) {
    playStep(step, nextTime)
    nextTime += SIXTEENTH
    step = (step + 1) % STEPS
  }
}

function playStep(index: number, at: number) {
  const bar = BARS[Math.floor(index / 16)]
  const s = index % 16

  // Basse en noires, avec une relance syncopée
  if (s % 4 === 0 || s === 14) {
    tone({ freq: midi(bar.bass), duration: SIXTEENTH * (s === 14 ? 1.5 : 3), type: 'triangle', volume: 0.16, at, bus: 'music' })
  }

  // Arpège en doubles croches, qui monte d'une octave sur la deuxième moitié de mesure
  const note = bar.arp[s % 3] + (s >= 8 ? 12 : 0)
  tone({ freq: midi(note), duration: SIXTEENTH * 0.8, volume: 0.028, at, bus: 'music' })

  // Batterie : grosse caisse, caisse claire, charleston
  if (s === 0 || s === 8 || s === 11) {
    tone({ freq: 150, slideTo: 45, duration: 0.12, type: 'sine', volume: 0.22, at, bus: 'music' })
  }
  if (s === 4 || s === 12) noise({ duration: 0.1, freq: 1800, filter: 'bandpass', q: 0.8, volume: 0.09, at, bus: 'music' })
  if (s % 2 === 1) noise({ duration: 0.025, freq: 8000, filter: 'highpass', volume: 0.03, at, bus: 'music' })
}
