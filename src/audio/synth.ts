import { audio } from './engine'

// Briques de base des sons : une note d'oscillateur, ou une rafale de bruit filtré,
// avec une enveloppe attaque / extinction rapide.

const MAX_VOICES = 32 // au-delà, les nouveaux sons sont ignorés (explosions en chaîne)
let voices = 0

type Timing = {
  delay?: number // décalage par rapport à maintenant, en secondes
  at?: number // instant absolu (horloge audio), prioritaire sur delay
  bus?: 'sfx' | 'music'
}

type ToneOptions = Timing & {
  freq: number
  duration: number
  type?: OscillatorType
  volume?: number
  slideTo?: number // glissement de fréquence jusqu'à la fin de la note
  attack?: number
}

type NoiseOptions = Timing & {
  duration: number
  freq: number // fréquence du filtre
  filter?: BiquadFilterType
  q?: number
  volume?: number
  sweepTo?: number // glissement de la fréquence du filtre
}

function start(timing: Timing) {
  const engine = audio()
  if (!engine || voices >= MAX_VOICES) return null
  const time = timing.at ?? engine.ctx.currentTime + (timing.delay ?? 0)
  return { engine, time, bus: engine[timing.bus ?? 'sfx'] }
}

function envelope(gain: GainNode, time: number, volume: number, attack: number, duration: number) {
  gain.gain.setValueAtTime(0.0001, time)
  gain.gain.exponentialRampToValueAtTime(volume, time + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)
}

function track(node: AudioScheduledSourceNode) {
  voices++
  node.onended = () => {
    voices--
  }
}

export function tone(options: ToneOptions) {
  const s = start(options)
  if (!s) return
  const { engine, time, bus } = s
  const osc = engine.ctx.createOscillator()
  osc.type = options.type ?? 'square'
  osc.frequency.setValueAtTime(options.freq, time)
  if (options.slideTo) osc.frequency.exponentialRampToValueAtTime(options.slideTo, time + options.duration)
  const gain = engine.ctx.createGain()
  envelope(gain, time, options.volume ?? 0.1, options.attack ?? 0.004, options.duration)
  osc.connect(gain).connect(bus)
  track(osc)
  osc.start(time)
  osc.stop(time + options.duration + 0.02)
}

export function noise(options: NoiseOptions) {
  const s = start(options)
  if (!s) return
  const { engine, time, bus } = s
  const source = engine.ctx.createBufferSource()
  source.buffer = engine.noise
  // Départ au hasard dans le tampon, pour que deux bruits successifs ne soient pas identiques
  const offset = Math.random() * (engine.noise.duration - options.duration - 0.05)
  const filter = engine.ctx.createBiquadFilter()
  filter.type = options.filter ?? 'lowpass'
  filter.Q.value = options.q ?? 0.7
  filter.frequency.setValueAtTime(options.freq, time)
  if (options.sweepTo) filter.frequency.exponentialRampToValueAtTime(options.sweepTo, time + options.duration)
  const gain = engine.ctx.createGain()
  envelope(gain, time, options.volume ?? 0.1, 0.003, options.duration)
  source.connect(filter).connect(gain).connect(bus)
  track(source)
  source.start(time, Math.max(0, offset), options.duration + 0.05)
}

// Fréquence d'une note MIDI (69 = la 440 Hz)
export const midi = (note: number) => 440 * Math.pow(2, (note - 69) / 12)
