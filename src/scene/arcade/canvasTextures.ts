import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { createRandom } from '../../game/random'

// Textures du décor, dessinées au canvas : aucune image à charger, et aucun texte.

function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

const NEON = { pink: '#ff3cac', cyan: '#2de2e6', yellow: '#ffd23f', purple: '#7b2ff7' }
const BRICK_COLORS = ['#ff4d6d', '#ffa62b', '#ffe14d', '#3ddc84', '#3ab8ff', '#b26bff']

// Petite brique biseautée, réutilisée dans plusieurs illustrations
function drawBrick(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#ffffff66'
  ctx.fillRect(x, y, w, h * 0.18)
  ctx.fillStyle = '#00000055'
  ctx.fillRect(x, y + h * 0.82, w, h * 0.18)
}

function glowCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, blur: number) {
  ctx.save()
  ctx.shadowColor = color
  ctx.shadowBlur = blur
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// Fronton lumineux : un mur de briques, une balle lumineuse et sa traînée, la raquette
export function marqueeTexture() {
  return canvasTexture(1024, 340, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 340)
    bg.addColorStop(0, '#1b0b3a')
    bg.addColorStop(1, '#5a1670')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 1024, 340)

    // Rayons qui partent de la balle
    ctx.save()
    ctx.globalAlpha = 0.16
    ctx.fillStyle = NEON.pink
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(512, 190)
      ctx.lineTo(512 + Math.cos(a) * 900, 190 + Math.sin(a) * 900)
      ctx.lineTo(512 + Math.cos(a + 0.12) * 900, 190 + Math.sin(a + 0.12) * 900)
      ctx.fill()
    }
    ctx.restore()

    // Murs de briques de part et d'autre, en perspective vers le centre
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 5; col++) {
        const color = BRICK_COLORS[(row + col) % BRICK_COLORS.length]
        drawBrick(ctx, 40 + col * 58, 50 + row * 34, 52, 28, color)
        drawBrick(ctx, 1024 - 40 - 52 - col * 58, 50 + row * 34, 52, 28, BRICK_COLORS[(row + col + 3) % 6])
      }
    }
    // Quelques éclats de briques qui volent
    const random = createRandom(11)
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = BRICK_COLORS[i % 6]
      const s = 6 + random() * 8
      ctx.fillRect(330 + random() * 360, 40 + random() * 120, s, s)
    }

    // Traînée de la balle puis la balle
    for (let i = 6; i > 0; i--) {
      ctx.globalAlpha = 0.12 * (7 - i)
      glowCircle(ctx, 512 - i * 26, 190 + i * 16, 22 - i * 2, NEON.cyan, 0)
    }
    ctx.globalAlpha = 1
    glowCircle(ctx, 512, 190, 26, '#ffffff', 40)

    // Raquette
    ctx.save()
    ctx.shadowColor = NEON.cyan
    ctx.shadowBlur = 20
    ctx.fillStyle = '#c9d1e0'
    ctx.fillRect(420, 280, 184, 26)
    ctx.restore()
    ctx.fillStyle = '#ff3b5c'
    ctx.fillRect(400, 280, 30, 26)
    ctx.fillRect(594, 280, 30, 26)
    ctx.fillStyle = NEON.cyan
    ctx.fillRect(440, 290, 144, 6)

    // Liseré néon
    ctx.strokeStyle = NEON.cyan
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, 1004, 320)
  })
}

// Décor des flancs de la borne. Les coordonnées du canvas suivent le profil latéral :
// x de l'arrière (gauche) vers l'avant (droite), y du sol (bas) vers le haut.
export function sideArtTexture() {
  return canvasTexture(512, 1024, (ctx) => {
    ctx.fillStyle = '#2a1652'
    ctx.fillRect(0, 0, 512, 1024)

    // Grandes bandes diagonales néon
    const stripes = [NEON.pink, NEON.yellow, NEON.cyan]
    stripes.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.beginPath()
      const offset = 640 + i * 70
      ctx.moveTo(-50, offset + 300)
      ctx.lineTo(600, offset - 360)
      ctx.lineTo(600, offset - 320)
      ctx.lineTo(-50, offset + 340)
      ctx.fill()
    })

    // Ciel étoilé dans la partie haute
    const random = createRandom(21)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.3 + random() * 0.6
      const s = random() < 0.2 ? 4 : 2
      ctx.fillRect(random() * 512, random() * 420, s, s)
    }
    ctx.globalAlpha = 1

    // Grappe de briques et une balle, en haut vers l'avant
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4 - row; col++) {
        drawBrick(ctx, 250 + col * 56 + row * 28, 130 + row * 32, 50, 26, BRICK_COLORS[(row * 2 + col) % 6])
      }
    }
    glowCircle(ctx, 210, 300, 18, '#ffffff', 30)

    // Bas sombre, comme une plinthe
    const fade = ctx.createLinearGradient(0, 800, 0, 1024)
    fade.addColorStop(0, '#2a165200')
    fade.addColorStop(1, '#0d0820')
    ctx.fillStyle = fade
    ctx.fillRect(0, 800, 512, 224)
  })
}

// Cadre décoré autour de l'écran, avec deux grilles de haut-parleurs
export function bezelTexture() {
  return canvasTexture(512, 484, (ctx) => {
    ctx.fillStyle = '#0c0a16'
    ctx.fillRect(0, 0, 512, 484)

    // Fenêtre de l'écran (le centre est caché par l'écran lui-même)
    ctx.strokeStyle = NEON.purple
    ctx.lineWidth = 4
    ctx.strokeRect(86, 30, 340, 424)
    ctx.strokeStyle = NEON.pink
    ctx.lineWidth = 2
    ctx.strokeRect(78, 22, 356, 440)

    // Haut-parleurs
    for (const cx of [42, 470]) {
      ctx.fillStyle = '#1b1830'
      ctx.beginPath()
      ctx.arc(cx, 60, 28, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#000000'
      for (let gy = -20; gy <= 20; gy += 7) {
        for (let gx = -20; gx <= 20; gx += 7) {
          if (gx * gx + gy * gy < 22 * 22) ctx.fillRect(cx + gx - 1.5, 60 + gy - 1.5, 3, 3)
        }
      }
    }

    // Petites étoiles pixel dans les coins bas
    ctx.fillStyle = NEON.yellow
    for (const [x, y] of [
      [40, 400],
      [470, 420],
    ]) {
      ctx.fillRect(x - 2, y - 8, 4, 16)
      ctx.fillRect(x - 8, y - 2, 16, 4)
    }
  })
}

// Dessus du panneau de commandes
export function controlPanelTexture() {
  return canvasTexture(512, 192, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 512, 0)
    bg.addColorStop(0, '#2a1652')
    bg.addColorStop(1, '#14102e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 512, 192)
    ctx.strokeStyle = NEON.cyan
    ctx.lineWidth = 3
    // Cercle autour du joystick et cadre autour des boutons
    ctx.beginPath()
    ctx.arc(155, 96, 50, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = NEON.pink
    ctx.strokeRect(270, 50, 200, 92)
    ctx.fillStyle = NEON.yellow
    ctx.fillRect(0, 180, 512, 6)
  })
}

// Ciel nocturne et ville, vus par la fenêtre
export function nightSkyTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const sky = ctx.createLinearGradient(0, 0, 0, 512)
    sky.addColorStop(0, '#16205a')
    sky.addColorStop(0.65, '#47308a')
    sky.addColorStop(1, '#a04c8e')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, 512, 512)

    const random = createRandom(3)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.3 + random() * 0.7
      ctx.fillRect(random() * 512, random() * 300, 2, 2)
    }
    ctx.globalAlpha = 1
    glowCircle(ctx, 370, 110, 38, '#f2f4ff', 50)

    // Immeubles avec quelques fenêtres allumées
    let x = 0
    while (x < 512) {
      const w = 40 + random() * 60
      const h = 90 + random() * 170
      ctx.fillStyle = '#1a1438'
      ctx.fillRect(x, 512 - h, w, h)
      for (let wy = 512 - h + 12; wy < 500; wy += 18) {
        for (let wx = x + 8; wx < x + w - 10; wx += 14) {
          if (random() < 0.3) {
            ctx.fillStyle = random() < 0.7 ? '#ffd27a' : '#7ad7ff'
            ctx.fillRect(wx, wy, 6, 9)
          }
        }
      }
      x += w + 4
    }
  })
}

// Affiche « synthwave » : soleil rayé au-dessus d'une grille, montagnes
export function posterSunsetTexture() {
  return canvasTexture(400, 560, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 380)
    bg.addColorStop(0, '#1a0638')
    bg.addColorStop(1, '#ff6f61')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 400, 560)

    const sun = ctx.createLinearGradient(0, 120, 0, 340)
    sun.addColorStop(0, '#ffe66d')
    sun.addColorStop(1, '#ff4f8b')
    ctx.fillStyle = sun
    ctx.beginPath()
    ctx.arc(200, 250, 120, 0, Math.PI * 2)
    ctx.fill()
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#c23a7a'
      ctx.fillRect(70, 255 + i * 18, 260, 4 + i * 1.5)
    }

    // Montagnes
    ctx.fillStyle = '#3a0f5c'
    ctx.beginPath()
    ctx.moveTo(0, 380)
    ;[
      [60, 300],
      [120, 350],
      [190, 280],
      [260, 345],
      [330, 290],
      [400, 340],
    ].forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.lineTo(400, 380)
    ctx.fill()

    ctx.fillStyle = '#12052a'
    ctx.fillRect(0, 380, 400, 180)
    ctx.strokeStyle = NEON.pink
    ctx.lineWidth = 2
    for (let i = 0; i <= 10; i++) {
      ctx.beginPath()
      ctx.moveTo(200, 380)
      ctx.lineTo(i * 80 - 200, 560)
      ctx.stroke()
    }
    for (let i = 0; i < 7; i++) {
      const y = 380 + (i * i * 180) / 36
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(400, y)
      ctx.stroke()
    }
    ctx.strokeStyle = NEON.cyan
    ctx.lineWidth = 8
    ctx.strokeRect(14, 14, 372, 532)
  })
}

// Affiche avec un envahisseur en gros pixels et des étoiles
export function posterInvaderTexture() {
  return canvasTexture(400, 560, (ctx) => {
    const bg = ctx.createLinearGradient(0, 0, 0, 560)
    bg.addColorStop(0, '#0b1d3a')
    bg.addColorStop(1, '#14425e')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 400, 560)

    const random = createRandom(8)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 50; i++) {
      ctx.globalAlpha = 0.3 + random() * 0.7
      ctx.fillRect(random() * 400, random() * 560, 3, 3)
    }
    ctx.globalAlpha = 1

    const invader = [
      '..x.....x..',
      '...x...x...',
      '..xxxxxxx..',
      '.xx.xxx.xx.',
      'xxxxxxxxxxx',
      'x.xxxxxxx.x',
      'x.x.....x.x',
      '...xx.xx...',
    ]
    const size = 28
    ctx.save()
    ctx.shadowColor = '#7dff6a'
    ctx.shadowBlur = 20
    ctx.fillStyle = '#7dff6a'
    invader.forEach((row, r) => {
      ;[...row].forEach((cell, c) => {
        if (cell === 'x') ctx.fillRect(46 + c * size, 170 + r * size, size - 2, size - 2)
      })
    })
    ctx.restore()

    // Tir et petite base en bas
    ctx.fillStyle = NEON.yellow
    ctx.fillRect(196, 440, 8, 30)
    ctx.fillStyle = NEON.cyan
    ctx.fillRect(160, 500, 80, 16)
    ctx.fillRect(190, 486, 20, 14)
  })
}

// Papier peint : rayures verticales douces et petits losanges
export function wallpaperTexture(base: string, stripe: string) {
  const texture = canvasTexture(256, 256, (ctx) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = stripe
    ctx.fillRect(0, 0, 64, 256)
    ctx.fillRect(128, 0, 64, 256)
    ctx.fillStyle = '#ffffff14'
    for (const [x, y] of [
      [96, 64],
      [224, 192],
      [96, 192],
      [224, 64],
    ]) {
      ctx.beginPath()
      ctx.moveTo(x, y - 10)
      ctx.lineTo(x + 7, y)
      ctx.lineTo(x, y + 10)
      ctx.lineTo(x - 7, y)
      ctx.fill()
    }
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

// Parquet : lames de teintes légèrement différentes, joints décalés
export function floorTexture() {
  const texture = canvasTexture(512, 512, (ctx) => {
    const random = createRandom(5)
    const plank = 64
    for (let row = 0; row < 512 / plank; row++) {
      let x = -random() * 200
      while (x < 512) {
        const length = 180 + random() * 160
        const shade = 0.85 + random() * 0.25
        ctx.fillStyle = `rgb(${Math.round(150 * shade)}, ${Math.round(100 * shade)}, ${Math.round(68 * shade)})`
        ctx.fillRect(x, row * plank, length, plank)
        ctx.fillStyle = '#00000040'
        ctx.fillRect(x, row * plank, 2, plank)
        x += length
      }
      ctx.fillStyle = '#00000055'
      ctx.fillRect(0, row * plank, 512, 2)
    }
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

// Écran de télévision : neige légère sur fond bleu
export function tvScreenTexture() {
  return canvasTexture(128, 96, (ctx) => {
    ctx.fillStyle = '#2a4fd6'
    ctx.fillRect(0, 0, 128, 96)
    const random = createRandom(9)
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = random() < 0.5 ? '#ffffff22' : '#00000022'
      ctx.fillRect(random() * 128, random() * 96, 2, 1)
    }
  })
}

// Écran du PC : fenêtres et barre des tâches façon années 90
export function pcScreenTexture() {
  return canvasTexture(128, 96, (ctx) => {
    ctx.fillStyle = '#1f8a8a'
    ctx.fillRect(0, 0, 128, 96)
    ctx.fillStyle = '#c0c0c0'
    ctx.fillRect(0, 86, 128, 10)
    ctx.fillRect(14, 14, 70, 50)
    ctx.fillStyle = '#1a2a8a'
    ctx.fillRect(14, 14, 70, 7)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(18, 26, 62, 34)
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#e8e8e8'
      ctx.fillRect(100, 8 + i * 18, 14, 12)
    }
  })
}
