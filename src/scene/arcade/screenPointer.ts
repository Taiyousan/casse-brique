import { type Camera, type Mesh, type PerspectiveCamera, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { crtCurve } from './crtMaterial'
import { SCREEN } from './layout'

// Lien entre la pièce et le jeu affiché dans l'écran de la borne,
// renseigné par ArcadeScreen une fois montée.
export const screenLink = {
  mesh: null as Mesh | null,
  gameCamera: null as PerspectiveCamera | null,
}

const raycaster = new Raycaster()
const screenPlane = new Plane()
const gamePlane = new Plane(new Vector3(0, 0, 1), 0)
const point = new Vector3()
const normal = new Vector3()
const origin = new Vector3()
const ndc = new Vector2()

// Convertit la position du pointeur (coordonnées normalisées de la fenêtre) en position x dans le jeu.
// On vise le plan infini de l'écran : la souris pilote la raquette même quand elle sort de l'écran.
export function pointerToGameX(pointer: Vector2, camera: Camera): number | null {
  const { mesh, gameCamera } = screenLink
  if (!mesh || !gameCamera) return null

  raycaster.setFromCamera(pointer, camera)
  mesh.getWorldDirection(normal)
  mesh.getWorldPosition(origin)
  screenPlane.setFromNormalAndCoplanarPoint(normal, origin)
  if (!raycaster.ray.intersectPlane(screenPlane, point)) return null

  // Position sur l'écran (0 à 1), puis point de l'image réellement affiché à cet endroit (bombé CRT)
  mesh.worldToLocal(point)
  const [u, v] = crtCurve(point.x / SCREEN.width + 0.5, point.y / SCREEN.height + 0.5)

  // Rayon de la caméra du jeu à travers ce point de l'image, jusqu'au plan du jeu (z = 0)
  raycaster.setFromCamera(ndc.set(u * 2 - 1, v * 2 - 1), gameCamera)
  if (!raycaster.ray.intersectPlane(gamePlane, point)) return null
  return point.x
}
