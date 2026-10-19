// Rectangle aligné sur les axes, décrit par son centre et ses demi-dimensions
export type Rect = { x: number; y: number; halfW: number; halfH: number }

// Normale de sortie (unitaire) et profondeur d'enfoncement
export type Hit = { nx: number; ny: number; depth: number }

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

// Collision cercle / rectangle. Renvoie null s'il n'y a pas de contact.
export function circleRect(cx: number, cy: number, r: number, rect: Rect): Hit | null {
  const dx = cx - rect.x
  const dy = cy - rect.y
  // Point du rectangle le plus proche du centre du cercle
  const ox = dx - clamp(dx, -rect.halfW, rect.halfW)
  const oy = dy - clamp(dy, -rect.halfH, rect.halfH)
  const d2 = ox * ox + oy * oy
  if (d2 > r * r) return null

  if (d2 > 1e-12) {
    const d = Math.sqrt(d2)
    return { nx: ox / d, ny: oy / d, depth: r - d }
  }

  // Centre à l'intérieur du rectangle : on ressort par le côté le plus proche
  const exitX = rect.halfW - Math.abs(dx)
  const exitY = rect.halfH - Math.abs(dy)
  return exitX < exitY
    ? { nx: Math.sign(dx) || 1, ny: 0, depth: exitX + r }
    : { nx: 0, ny: Math.sign(dy) || 1, depth: exitY + r }
}

type Body = { x: number; y: number; vx: number; vy: number }

// Fait rebondir un corps sur une surface de normale (nx, ny) et le sort de l'obstacle.
export function bounce(body: Body, hit: Hit) {
  body.x += hit.nx * hit.depth
  body.y += hit.ny * hit.depth
  const dot = body.vx * hit.nx + body.vy * hit.ny
  // On ne réfléchit que si le corps se dirige vers la surface
  if (dot < 0) {
    body.vx -= 2 * dot * hit.nx
    body.vy -= 2 * dot * hit.ny
  }
}
