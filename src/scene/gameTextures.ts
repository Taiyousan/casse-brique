import { CanvasTexture, NearestFilter, RepeatWrapping, SRGBColorSpace } from 'three'
import { COLORS } from '../game/constants'

// Textures pixel art du jeu, dessinées au canvas.

function pixelTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d')!)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  return texture
}

// Brique biseautée, en niveaux de gris : la couleur de chaque brique vient de l'instance.
// Arête claire en haut à gauche, sombre en bas à droite, et un reflet dans le coin.
export function brickBevelTexture() {
  return pixelTexture(32, 16, (ctx) => {
    ctx.fillStyle = '#b8b8b8'
    ctx.fillRect(0, 0, 32, 16)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 32, 2)
    ctx.fillRect(0, 0, 2, 16)
    ctx.fillStyle = '#5a5a5a'
    ctx.fillRect(0, 14, 32, 2)
    ctx.fillRect(30, 0, 2, 16)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(4, 4, 4, 2)
    ctx.fillRect(4, 4, 2, 4)
  })
}

// Quadrillage discret du fond de l'écran
export function gridTexture() {
  const texture = pixelTexture(64, 64, (ctx) => {
    ctx.fillStyle = COLORS.panel
    ctx.fillRect(0, 0, 64, 64)
    ctx.fillStyle = COLORS.grid
    ctx.globalAlpha = 0.12
    ctx.fillRect(0, 0, 64, 2)
    ctx.fillRect(0, 0, 2, 64)
  })
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  return texture
}

// Lettre blanche d'une capsule de bonus
export function letterTexture(letter: string) {
  return pixelTexture(64, 64, (ctx) => {
    ctx.fillStyle = '#ffffff'
    ctx.font = '40px "Press Start 2P", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(letter, 32, 34)
  })
}
