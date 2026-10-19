// Éclairage du jeu dans l'écran : franc et lumineux, avec un soleil en haut à droite
// qui projette l'ombre des objets sur le fond, pour la lecture de la profondeur.
const SHADOW_EXTENT = 22

export function Lights() {
  return (
    <>
      <hemisphereLight args={['#ffffff', '#4a3f8a', 1.6]} />
      <directionalLight
        castShadow
        position={[9, 14, 16]}
        intensity={2.6}
        color="#ffffff"
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
        shadow-camera-left={-SHADOW_EXTENT}
        shadow-camera-right={SHADOW_EXTENT}
        shadow-camera-top={SHADOW_EXTENT}
        shadow-camera-bottom={-SHADOW_EXTENT}
        shadow-camera-near={1}
        shadow-camera-far={70}
      />
    </>
  )
}
