import { Vector3 } from 'three'

// Dimensions de la borne, en mètres. Elle est posée à l'origine, face à +z, dos au mur.
// Le profil latéral est décrit en (z, y) : z vers l'avant, y vers le haut.

export const CABINET = {
  width: 0.66, // largeur intérieure, entre les deux flancs
  sideThickness: 0.04,
  profile: [
    [-0.3, 0],
    [0.32, 0],
    [0.32, 0.88], // façade, jusque sous le panneau de commandes
    [0.46, 0.96], // rebord avant du panneau de commandes
    [0.44, 1.02],
    [0.25, 1.05], // bas de l'écran
    [0.12, 1.66], // haut de l'écran (incliné vers l'arrière)
    [0.3, 1.7], // casquette du fronton
    [0.3, 1.92],
    [-0.3, 1.92],
  ] as [number, number][],
}

const SCREEN_BOTTOM = new Vector3(0, 1.05, 0.25)
const SCREEN_TOP = new Vector3(0, 1.66, 0.12)

// Écran vertical au format 3:4, comme les bornes de casse-brique des années 80
export const SCREEN = {
  width: 0.405,
  height: 0.54,
  center: SCREEN_BOTTOM.clone().add(SCREEN_TOP).multiplyScalar(0.5),
  // Inclinaison vers l'arrière, par rapport à la verticale
  tilt: Math.atan2(SCREEN_BOTTOM.z - SCREEN_TOP.z, SCREEN_TOP.y - SCREEN_BOTTOM.y),
  bezelHeight: SCREEN_TOP.distanceTo(SCREEN_BOTTOM),
}

// Direction vers laquelle regarde l'écran (légèrement vers le haut, puisqu'il est incliné)
export const SCREEN_NORMAL = new Vector3(0, Math.sin(SCREEN.tilt), Math.cos(SCREEN.tilt))

// Point juste devant l'écran, d'où part sa lueur dans la pièce
export const SCREEN_FRONT = SCREEN.center.clone().addScaledVector(SCREEN_NORMAL, 0.3)

// Résolution de la texture dans laquelle le jeu est rendu
export const SCREEN_TEXTURE = { width: 960, height: 1280 }

export const ROOM = {
  width: 6,
  depth: 4.6,
  height: 2.8,
  backZ: -0.33, // mur du fond, juste derrière la borne
  leftX: -3,
}
