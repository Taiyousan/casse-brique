import { create } from 'zustand'

// Préférences audio, conservées dans le navigateur
const KEY = 'casse-brique:audio'

type AudioSettings = {
  sound: boolean // coupe tout (effets et musique)
  music: boolean
  toggleSound: () => void
  toggleMusic: () => void
}

function load(): Pick<AudioSettings, 'sound' | 'music'> {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    return { sound: saved.sound !== false, music: saved.music !== false }
  } catch {
    return { sound: true, music: true }
  }
}

function save(settings: Pick<AudioSettings, 'sound' | 'music'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Stockage indisponible : le réglage vaut jusqu'à la fermeture de la page
  }
}

export const useAudioSettings = create<AudioSettings>()((set, get) => ({
  ...load(),
  toggleSound: () => {
    set({ sound: !get().sound })
    save(get())
  },
  toggleMusic: () => {
    set({ music: !get().music })
    save(get())
  },
}))
