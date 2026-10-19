// Le jeu se déroule sur un plan vertical XY face à la caméra : x = gauche/droite, y = bas/haut.
// La raquette est en bas, les briques en haut. z = profondeur (positif vers la caméra).

export const FIELD = {
  width: 16, // x ∈ [-8, 8]
  height: 22, // y ∈ [-11, 11]
}

export const FRAME = {
  thickness: 0.8, // largeur des montants et de la traverse du haut
  depth: 1.4, // saillie du cadre devant le panneau de fond
}

// Face avant du panneau de fond : les objets du jeu (centrés en z = 0) flottent juste devant.
export const PANEL_Z = -0.5

// Le pied du panneau repose sur le sol, un peu sous la zone de jeu.
export const GROUND_Y = -FIELD.height / 2 - 2.5

export const PADDLE = {
  width: 2.8,
  height: 0.6,
  depth: 0.8,
  y: -FIELD.height / 2 + 1.5,
  keyboardSpeed: 24, // unités par seconde
  // Angle de renvoi maximal (par rapport à la verticale) quand la balle touche le bord
  maxBounceAngle: (60 * Math.PI) / 180,
}

export const BALL = {
  radius: 0.32,
  speed: 14, // unités par seconde, au service du premier niveau
  speedPerLevel: 0.4, // vitesse de service en plus à chaque niveau
  maxSpeed: 22,
  speedGain: 0.08, // accélération à chaque brique touchée
  // Composante verticale minimale (fraction de la vitesse) : évite les trajectoires presque horizontales
  minVertical: 0.3,
  max: 8, // nombre maximal de balles simultanées (multi-balle)
}

// Grille des briques : 12 colonnes sur toute la largeur, la première rangée sous la traverse
export const BRICKS = {
  columns: 12,
  maxRows: 14,
  cellWidth: FIELD.width / 12,
  cellHeight: 0.7,
  width: FIELD.width / 12 - 0.1,
  height: 0.6,
  depth: 0.8,
  topY: FIELD.height / 2 - 2.5, // haut de la première rangée
  enterDuration: 0.45, // durée de la chute d'une brique à l'entrée du niveau
}

export const POINTS = {
  normal: 50,
  strong: 50, // par point de résistance
  explosive: 80,
}

// En dessous de cette hauteur, la balle est perdue
export const LOST_Y = -FIELD.height / 2 - 2

export const START_LIVES = 3

// Palette néon de l'écran de la borne
export const COLORS = {
  screenBackground: '#07051a',
  panel: '#100b2e',
  grid: '#2de2e6',
  gutter: '#0a0720',
  frame: '#3a3470',
  neon: '#2de2e6',
  paddleBody: '#c9d1e0',
  paddleCaps: '#ff3b5c',
  paddleLight: '#2de2e6',
  ball: '#ffffff',
  bricks: {
    // Briques normales, une couleur par lettre de la grille de niveau
    r: '#ff4d6d',
    o: '#ffa62b',
    y: '#ffe14d',
    g: '#3ddc84',
    b: '#3ab8ff',
    p: '#b26bff',
  } as Record<string, string>,
  // Briques résistantes (argent), de la plus abîmée (1 PV) à la plus solide (3 PV)
  strong: ['#7f889c', '#b0b8c9', '#e3e8f2'],
  steel: '#e8b923', // indestructibles (or)
  explosive: '#ff2e2e',
  laser: '#ff4d4d',
  pierce: '#ff8a2a',
  // Points flottants et annonce du combo, selon le multiplicateur (×1 à ×5)
  multiplier: ['#ffffff', '#ffd23f', '#2de2e6', '#ff3cac', '#ff8a2a'],
}
