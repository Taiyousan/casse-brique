import { type Camera, type Material, Mesh, type Object3D, PlaneGeometry, Scene, type WebGLRenderer } from 'three'

// Matériaux qui ne sont posés sur un objet qu'en cours de partie (capsules de bonus, par exemple) :
// on les déclare ici pour les compiler dès le chargement.
export const lateMaterials = new Set<Material>()

// Compile à l'avance tous les shaders d'une scène, y compris ceux des objets encore masqués
// (lasers, canons, capsules…). Sans cela, leur première apparition provoque un à-coup.
export function warmUp(gl: WebGLRenderer, scene: Scene, camera: Camera) {
  const hidden: Object3D[] = []
  scene.traverse((object) => {
    if (!object.visible) {
      hidden.push(object)
      object.visible = true
    }
  })
  gl.compile(scene, camera)
  hidden.forEach((object) => {
    object.visible = false
  })

  // Les matériaux posés plus tard sont compilés avec l'éclairage de la scène (3e argument)
  const geometry = new PlaneGeometry()
  const extra = new Scene()
  lateMaterials.forEach((material) => extra.add(new Mesh(geometry, material)))
  gl.compile(extra, camera, scene)
  geometry.dispose()
}
