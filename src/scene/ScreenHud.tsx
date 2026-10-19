import { useFrame } from '@react-three/fiber'
import { type Ref, useEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  MathUtils,
  type Mesh,
  MeshBasicMaterial,
  NearestFilter,
  type PerspectiveCamera,
  SRGBColorSpace,
} from 'three'
import { COLORS } from '../game/constants'
import { POWERUPS, type PowerUpKind } from '../game/powerups'
import { useGameStore } from '../game/store'
import { world } from '../game/world'
import { isTouch } from '../ui/format'

// Grille virtuelle de l'écran, en pixels. Résolution volontairement basse :
// les pixels de la police restent bien visibles.
const VIEW = { width: 480, height: 640 }

// Hauteur des bandeaux haut et bas, en fraction de l'écran (voir le cadrage dans GameWorld)
export type HudBands = { top: number; bottom: number }

const FONT = '"Press Start 2P", monospace'
const BANNER_DURATION = 2.6 // annonce du niveau, en secondes
const TOAST_DURATION = 1.4 // nom du bonus ramassé
const COMBO_DURATION = 1.1 // annonce du combo
const TOAST_RISE = 30 // montée du nom du bonus, en pixels
const DISTANCE = 1 // distance des calques devant la caméra

const INK = {
  label: '#ff3cac',
  value: '#ffffff',
  accent: '#ffd23f',
  hint: '#2de2e6',
}

// Un calque = une bande horizontale de l'écran, avec son propre petit canvas.
// Chaque calque n'est redessiné (et renvoyé à la carte graphique) que si son contenu change ;
// les fondus et clignotements passent par l'opacité ou la visibilité, sans redessin.
type Layer = {
  ctx: CanvasRenderingContext2D
  texture: CanvasTexture
  material: MeshBasicMaterial
  top: number // position dans la grille virtuelle, en pixels
  height: number
}

function createLayer(top: number, height: number): Layer {
  const canvas = document.createElement('canvas')
  canvas.width = VIEW.width
  canvas.height = height
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.magFilter = NearestFilter
  texture.minFilter = NearestFilter
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  })
  return { ctx: canvas.getContext('2d')!, texture, material, top, height }
}

function redraw(layer: Layer, paint: (ctx: CanvasRenderingContext2D) => void) {
  layer.ctx.clearRect(0, 0, VIEW.width, layer.height)
  paint(layer.ctx)
  layer.texture.needsUpdate = true
}

// Interface affichée dans l'écran de la borne : score, record, niveau, vies, effets en cours,
// annonces et consignes. Les calques sont plaqués devant la caméra du jeu.
export function ScreenHud({ camera, bands }: { camera: PerspectiveCamera; bands: HudBands }) {
  const layers = useMemo(() => {
    const topHeight = Math.round(bands.top * VIEW.height)
    const bottomHeight = Math.round(bands.bottom * VIEW.height)
    const bottomTop = VIEW.height - bottomHeight
    return {
      top: createLayer(0, topHeight),
      bottom: createLayer(bottomTop, bottomHeight),
      banner: createLayer(Math.round(VIEW.height * 0.44), 64),
      combo: createLayer(Math.round(VIEW.height * 0.54), 24),
      toast: createLayer(Math.round(VIEW.height * 0.6), 24),
      // Au-dessus de la raquette, entre elle et l'annonce du niveau
      hint: createLayer(Math.round(VIEW.height * 0.72), 16),
    }
  }, [bands])

  const banner = useRef<Mesh>(null)
  const combo = useRef<Mesh>(null)
  const toast = useRef<Mesh>(null)
  const hint = useRef<Mesh>(null)
  // Ce qui est actuellement dessiné dans chaque calque, et le début des annonces (world.time)
  const drawn = useRef({ top: '', bottom: '', banner: '', toast: '', hint: '' })
  const timers = useRef({ bannerKey: -1, bannerAt: 0, toastKey: -1, toastAt: 0, comboAt: -Infinity, multiplier: 1 })
  const font = useRef(false)

  useEffect(() => {
    document.fonts.load(`16px ${FONT}`).then(() => {
      font.current = true
    })
  }, [])

  useFrame(() => {
    const s = useGameStore.getState()
    const time = world.time
    const menu = s.status === 'menu'
    const tag = font.current ? 'f' : '-' // redessine tout une fois la police chargée

    // ---- Bandeau du haut : score, record, niveau ----
    const top = `${tag}|${menu}|${s.score}|${s.best}|${s.level}|${s.multiplier}`
    if (top !== drawn.current.top) {
      drawn.current.top = top
      redraw(layers.top, (ctx) => drawTop(ctx, layers.top.height, s, menu))
    }

    // ---- Bandeau du bas : vies et effets en cours (jauges arrondies à 1/24) ----
    const effects = menu
      ? []
      : (Object.keys(world.effects) as PowerUpKind[]).map((kind) => ({
          kind,
          left: Math.round((world.effects[kind]! / POWERUPS[kind].duration) * 24) / 24,
        }))
    const bottom = `${tag}|${menu ? 0 : s.lives}|${effects.map((e) => e.kind + e.left).join()}`
    if (bottom !== drawn.current.bottom) {
      drawn.current.bottom = bottom
      redraw(layers.bottom, (ctx) => drawBottom(ctx, layers.bottom.height, menu ? 0 : s.lives, effects))
    }

    // ---- Annonce du niveau : dessinée une fois, puis fondu par l'opacité ----
    if (s.levelIntro !== timers.current.bannerKey) timers.current = { ...timers.current, bannerKey: s.levelIntro, bannerAt: time }
    const bannerText = `${tag}|${s.level}`
    if (bannerText !== drawn.current.banner) {
      drawn.current.banner = bannerText
      redraw(layers.banner, (ctx) => drawBanner(ctx, s.level))
    }
    const bannerProgress = (time - timers.current.bannerAt) / BANNER_DURATION
    banner.current!.visible = !menu && bannerProgress < 1
    layers.banner.material.opacity = fade(bannerProgress)

    // ---- « COMBO x3 » quand le multiplicateur augmente : grossit d'un coup puis s'efface ----
    if (s.multiplier > timers.current.multiplier && s.multiplier > 1) {
      timers.current.comboAt = time
      redraw(layers.combo, (ctx) => drawCombo(ctx, s.multiplier))
    }
    timers.current.multiplier = s.multiplier
    const comboProgress = (time - timers.current.comboAt) / COMBO_DURATION
    combo.current!.visible = !menu && comboProgress >= 0 && comboProgress < 1
    combo.current!.scale.setScalar(1 + 0.6 * Math.max(0, 1 - comboProgress * 5) ** 2)
    layers.combo.material.opacity = comboProgress < 0.6 ? 1 : (1 - comboProgress) / 0.4

    // ---- Nom du bonus ramassé : monte en s'effaçant ----
    if (s.toast && s.toast.key !== timers.current.toastKey) timers.current = { ...timers.current, toastKey: s.toast.key, toastAt: time }
    const toastText = s.toast ? `${tag}|${s.toast.kind}` : ''
    if (toastText !== drawn.current.toast) {
      drawn.current.toast = toastText
      redraw(layers.toast, (ctx) => s.toast && drawToast(ctx, s.toast.kind))
    }
    const toastProgress = s.toast ? (time - timers.current.toastAt) / TOAST_DURATION : 1
    toast.current!.visible = toastProgress < 1
    layers.toast.material.opacity = 1 - toastProgress ** 2
    toast.current!.position.y = layerY(layers.toast, camera) + pixels(TOAST_RISE * toastProgress, camera)

    // ---- Consigne, qui clignote par la visibilité ----
    const hintText = s.status === 'serving' ? (isTouch ? 'TOUCHEZ POUR LANCER' : 'CLIC POUR LANCER') : ''
    if (`${tag}|${hintText}` !== drawn.current.hint) {
      drawn.current.hint = `${tag}|${hintText}`
      redraw(layers.hint, (ctx) => text(ctx, hintText, VIEW.width / 2, 4, 8, INK.hint, 'center'))
    }
    hint.current!.visible = hintText !== '' && Math.floor(time * 2.5) % 2 === 0
  })

  // Calques à placer comme enfants de la caméra du jeu (voir GameWorld)
  return (
    <>
      <LayerMesh layer={layers.top} camera={camera} />
      <LayerMesh layer={layers.bottom} camera={camera} />
      <LayerMesh layer={layers.banner} camera={camera} meshRef={banner} />
      <LayerMesh layer={layers.combo} camera={camera} meshRef={combo} />
      <LayerMesh layer={layers.toast} camera={camera} meshRef={toast} />
      <LayerMesh layer={layers.hint} camera={camera} meshRef={hint} />
    </>
  )
}

// Hauteur visible à la distance des calques, et conversion pixels de la grille → unités
function viewHeight(camera: PerspectiveCamera) {
  return 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * DISTANCE
}
const pixels = (px: number, camera: PerspectiveCamera) => (px / VIEW.height) * viewHeight(camera)
// Centre vertical d'un calque, l'origine étant au centre de l'écran
const layerY = (layer: Layer, camera: PerspectiveCamera) => pixels(VIEW.height / 2 - layer.top - layer.height / 2, camera)

type LayerMeshProps = { layer: Layer; camera: PerspectiveCamera; meshRef?: Ref<Mesh> }

function LayerMesh({ layer, camera, meshRef }: LayerMeshProps) {
  const height = viewHeight(camera)
  return (
    <mesh ref={meshRef} position={[0, layerY(layer, camera), -DISTANCE]} material={layer.material} renderOrder={10}>
      <planeGeometry args={[height * camera.aspect, pixels(layer.height, camera)]} />
    </mesh>
  )
}

// Apparition rapide, maintien, disparition
function fade(progress: number) {
  if (progress < 0.12) return progress / 0.12
  if (progress > 0.75) return Math.max(0, (1 - progress) / 0.25)
  return 1
}

const score = (value: number) => String(value).padStart(6, '0')

function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color: string,
  align: CanvasTextAlign = 'left',
) {
  ctx.font = `${size}px ${FONT}`
  ctx.textAlign = align
  ctx.textBaseline = 'top'
  // Ombre portée d'un pixel, comme sur les écrans d'arcade
  ctx.fillStyle = '#000000'
  ctx.fillText(value, x + 2, y + 2)
  ctx.fillStyle = color
  ctx.fillText(value, x, y)
}

type HudState = ReturnType<typeof useGameStore.getState>

function drawTop(ctx: CanvasRenderingContext2D, height: number, s: HudState, menu: boolean) {
  const W = VIEW.width
  const y = Math.max(8, height / 2 - 14)
  text(ctx, 'SCORE', 16, y, 8, INK.label)
  text(ctx, score(s.score), 16, y + 14, 16, INK.value)
  if (s.multiplier > 1) text(ctx, `x${s.multiplier}`, 16 + 6 * 16 + 8, y + 14, 16, INK.accent)
  text(ctx, 'RECORD', W / 2 + 40, y, 8, INK.label, 'center')
  text(ctx, score(Math.max(s.best, s.score)), W / 2 + 40, y + 14, 16, INK.value, 'center')
  if (!menu) {
    text(ctx, 'NIV', W - 16, y, 8, INK.label, 'right')
    text(ctx, String(s.level + 1), W - 16, y + 14, 16, INK.value, 'right')
  }
}

// Vies en petites raquettes à gauche, effets en cours à droite
function drawBottom(
  ctx: CanvasRenderingContext2D,
  height: number,
  lives: number,
  effects: { kind: PowerUpKind; left: number }[],
) {
  const iconY = (height - 10) / 2
  for (let i = 0; i < lives; i++) {
    const x = 16 + i * 30
    ctx.fillStyle = COLORS.paddleCaps
    ctx.fillRect(x, iconY, 24, 10)
    ctx.fillStyle = COLORS.paddleBody
    ctx.fillRect(x + 5, iconY + 1, 14, 8)
    ctx.fillStyle = COLORS.paddleLight
    ctx.fillRect(x + 7, iconY + 4, 10, 2)
  }
  effects.forEach((effect, i) => {
    const def = POWERUPS[effect.kind]
    const size = 20
    const x = VIEW.width - 16 - (i + 1) * (size + 8) + 8
    const y = (height - size - 6) / 2
    ctx.fillStyle = def.color
    ctx.fillRect(x, y, size, size)
    text(ctx, def.letter, x + size / 2, y + 6, 8, '#ffffff', 'center')
    // Jauge du temps restant
    ctx.fillStyle = '#ffffff40'
    ctx.fillRect(x, y + size + 3, size, 3)
    ctx.fillStyle = def.color
    ctx.fillRect(x, y + size + 3, Math.round(size * effect.left), 3)
  })
}

function drawBanner(ctx: CanvasRenderingContext2D, level: number) {
  text(ctx, `NIVEAU ${level + 1}`, VIEW.width / 2, 18, 24, INK.accent, 'center')
}

function drawCombo(ctx: CanvasRenderingContext2D, multiplier: number) {
  const color = COLORS.multiplier[Math.min(multiplier, COLORS.multiplier.length) - 1]
  text(ctx, `COMBO x${multiplier}`, VIEW.width / 2, 4, 16, color, 'center')
}

function drawToast(ctx: CanvasRenderingContext2D, kind: PowerUpKind) {
  const def = POWERUPS[kind]
  text(ctx, `${def.label.toUpperCase()} !`, VIEW.width / 2, 4, 12, def.color, 'center')
}
