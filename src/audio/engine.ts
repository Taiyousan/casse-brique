import { useAudioSettings } from './settings'

// Moteur audio : un contexte Web Audio unique et des bus séparés.
//
//   effets ─┐
//           ├─► filtre « borne » ─► volume général ─► compresseur ─► sortie
//   musique ┘
//
// Le filtre « borne » étouffe les sons du jeu quand la caméra est dans la chambre,
// comme s'ils sortaient du haut-parleur de la machine.

export type Engine = {
  ctx: AudioContext
  master: GainNode
  sfx: GainNode
  music: GainNode
  cabinet: BiquadFilterNode
  noise: AudioBuffer // bruit blanc partagé par tous les sons de bruit
}

const MUSIC_VOLUME = 0.55

let engine: Engine | null = null

// null tant que le son n'a pas été débloqué par une interaction de l'utilisateur
export function audio() {
  return engine
}

// Les navigateurs n'autorisent le son qu'après un clic ou une touche : à appeler à ce moment-là
export function unlockAudio() {
  if (!engine) {
    engine = createEngine()
    useAudioSettings.subscribe(applySettings)
    applySettings()
  }
  if (engine.ctx.state === 'suspended') void engine.ctx.resume()
  return engine
}

function createEngine(): Engine {
  const ctx = new AudioContext()

  // Le compresseur évite la saturation quand beaucoup de sons se superposent (explosions en chaîne)
  const compressor = ctx.createDynamicsCompressor()
  compressor.threshold.value = -14
  compressor.ratio.value = 4
  compressor.connect(ctx.destination)

  const master = ctx.createGain()
  master.connect(compressor)

  const cabinet = ctx.createBiquadFilter()
  cabinet.type = 'lowpass'
  cabinet.frequency.value = 20000
  cabinet.connect(master)

  const sfx = ctx.createGain()
  sfx.gain.value = 0.8
  sfx.connect(cabinet)

  const music = ctx.createGain()
  music.gain.value = 0
  music.connect(cabinet)

  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  return { ctx, master, sfx, music, cabinet, noise }
}

function applySettings() {
  if (!engine) return
  const { sound, music } = useAudioSettings.getState()
  const now = engine.ctx.currentTime
  engine.master.gain.setTargetAtTime(sound ? 1 : 0, now, 0.05)
  engine.music.gain.setTargetAtTime(music ? MUSIC_VOLUME : 0, now, 0.1)
}

// Étouffement des sons de la borne : 0 = net (caméra dans l'écran), 1 = très étouffé (chambre)
export function setCabinetMuffle(amount: number) {
  if (!engine) return
  const frequency = 20000 * Math.pow(1200 / 20000, amount)
  engine.cabinet.frequency.setTargetAtTime(frequency, engine.ctx.currentTime, 0.35)
}
