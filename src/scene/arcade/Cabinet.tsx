import { useMemo } from 'react'
import { ExtrudeGeometry, MeshStandardMaterial, Shape, Vector2 } from 'three'
import { ArcadeScreen } from './ArcadeScreen'
import { bezelTexture, controlPanelTexture, marqueeTexture, sideArtTexture } from './canvasTextures'
import { CABINET, SCREEN } from './layout'

const COLORS = {
  sideEdge: '#1b0f30',
  body: '#2a1748',
  panel: '#1a1028',
  metal: '#9aa0ab',
  darkMetal: '#3a3d45',
  joystick: '#e63946',
  buttons: ['#ffd23f', '#00c2ff'],
  start: '#f4f4f4',
  coin: '#ff7a1a',
  molding: '#ff3cac',
}

const W = CABINET.width
const HALF_W = W / 2
const T = CABINET.sideThickness

// Étendue du profil, pour plaquer le décor des flancs
const PROFILE_Z = { min: -0.3, max: 0.46 }
const PROFILE_HEIGHT = 1.92

// Borne d'arcade modélisée à partir de formes simples : deux flancs extrudés depuis un profil,
// et des panneaux entre les deux.
export function Cabinet() {
  const textures = useMemo(
    () => ({
      marquee: marqueeTexture(),
      bezel: bezelTexture(),
      controlPanel: controlPanelTexture(),
    }),
    [],
  )

  return (
    <group>
      <SidePanels />

      {/* Façade basse, plaque de protection et porte des monnayeurs */}
      <mesh position={[0, 0.44, 0.31]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.88, 0.02]} />
        <meshStandardMaterial color={COLORS.body} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.07, 0.323]} castShadow>
        <boxGeometry args={[W, 0.14, 0.01]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.35} />
      </mesh>
      <CoinDoor />

      {/* Panneau de commandes, incliné vers le joueur */}
      <group position={[0, 1.0, 0.355]} rotation-x={Math.atan2(0.08, 0.2)}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[W + 0.06, 0.04, 0.23]} />
          {/* Ordre des faces d'une boîte : +x, -x, +y (dessus), -y, +z, -z */}
          {[0, 1, 2, 3, 4, 5].map((face) => (
            <meshStandardMaterial
              key={face}
              attach={`material-${face}`}
              color={face === 2 ? '#ffffff' : COLORS.panel}
              map={face === 2 ? textures.controlPanel : null}
              roughness={0.5}
            />
          ))}
        </mesh>
        {/* Joystick */}
        <mesh position={[-0.14, 0.05, 0]} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.14, 0.095, 0]} castShadow>
          <icosahedronGeometry args={[0.025, 2]} />
          <meshStandardMaterial color={COLORS.joystick} roughness={0.25} />
        </mesh>
        <mesh position={[-0.14, 0.022, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.006, 12]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        {/* Boutons de jeu, et deux petits boutons « start » près de l'écran */}
        {COLORS.buttons.map((color, i) => (
          <ArcadeButton key={color} position={[0.06 + i * 0.09, 0.02, 0.01]} radius={0.022} color={color} />
        ))}
        {[-0.04, 0.02].map((x) => (
          <ArcadeButton key={x} position={[x, 0.02, -0.08]} radius={0.012} color={COLORS.start} />
        ))}
      </group>

      {/* Cadre décoré autour de l'écran, puis l'écran lui-même */}
      <group position={SCREEN.center} rotation-x={-SCREEN.tilt}>
        <mesh position-z={-0.011} receiveShadow>
          <boxGeometry args={[W, SCREEN.bezelHeight, 0.02]} />
          <meshStandardMaterial color="#0c0a12" roughness={0.3} />
        </mesh>
        <mesh position-z={-0.0005}>
          <planeGeometry args={[W, SCREEN.bezelHeight]} />
          <meshStandardMaterial map={textures.bezel} roughness={0.35} />
        </mesh>
        <group position-z={0.002}>
          <ArcadeScreen />
        </group>
      </group>

      {/* Casquette au-dessus de l'écran et fronton lumineux */}
      <mesh position={[0, 1.69, 0.21]} castShadow>
        <boxGeometry args={[W, 0.02, 0.19]} />
        <meshStandardMaterial color={COLORS.body} />
      </mesh>
      <mesh position={[0, 1.81, 0.295]}>
        <boxGeometry args={[W, 0.22, 0.02]} />
        <meshStandardMaterial
          color="#000000"
          emissive="#ffffff"
          emissiveMap={textures.marquee}
          emissiveIntensity={1.4}
        />
      </mesh>

      {/* Dessus et dos */}
      <mesh position={[0, 1.91, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, 0.02, 0.6]} />
        <meshStandardMaterial color={COLORS.body} />
      </mesh>
      <mesh position={[0, 0.96, -0.29]} castShadow receiveShadow>
        <boxGeometry args={[W, 1.92, 0.02]} />
        <meshStandardMaterial color={COLORS.body} />
      </mesh>
    </group>
  )
}

// Flancs : le profil (z, y) est extrudé selon x, avec un décor sur les faces
// et un liseré néon (« T-molding ») tout autour de la tranche.
function SidePanels() {
  const { geometry, materials, moldings } = useMemo(() => {
    const points = CABINET.profile.map(([z, y]) => new Vector2(z, y))
    const geometry = new ExtrudeGeometry(new Shape(points), { depth: T, bevelEnabled: false })

    // Les UV des faces suivent les coordonnées du profil : on les ramène entre 0 et 1
    const art = sideArtTexture()
    art.repeat.set(1 / (PROFILE_Z.max - PROFILE_Z.min), 1 / PROFILE_HEIGHT)
    art.offset.set(-PROFILE_Z.min / (PROFILE_Z.max - PROFILE_Z.min), 0)
    // Groupe 0 : les deux faces ; groupe 1 : la tranche
    const materials = [
      new MeshStandardMaterial({ map: art, roughness: 0.55 }),
      new MeshStandardMaterial({ color: COLORS.sideEdge, roughness: 0.6 }),
    ]

    // Un segment de liseré par côté du profil
    const moldings = points.map((start, i) => {
      const end = points[(i + 1) % points.length]
      const dz = end.x - start.x
      const dy = end.y - start.y
      return {
        z: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
        length: Math.hypot(dz, dy),
        angle: Math.atan2(dy, dz),
      }
    })
    return { geometry, materials, moldings }
  }, [])

  return (
    <>
      {[-1, 1].map((side) => {
        // Rotation : x local du profil → z du monde, extrusion vers -x
        const x = side < 0 ? -HALF_W : HALF_W + T
        return (
          <group key={side}>
            <mesh geometry={geometry} material={materials} rotation-y={-Math.PI / 2} position-x={x} castShadow receiveShadow />
            {moldings.map((m, i) => (
              <mesh key={i} position={[x - T / 2, m.y, m.z]} rotation-x={-m.angle}>
                <boxGeometry args={[T + 0.006, 0.012, m.length + 0.012]} />
                <meshStandardMaterial color={COLORS.molding} emissive={COLORS.molding} emissiveIntensity={1.2} />
              </mesh>
            ))}
          </group>
        )
      })}
    </>
  )
}

function ArcadeButton({ position, radius, color }: { position: [number, number, number]; radius: number; color: string }) {
  return (
    <group position={position}>
      {/* Bague noire, puis le bouton bombé */}
      <mesh>
        <cylinderGeometry args={[radius * 1.25, radius * 1.25, 0.008, 14]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position-y={0.008} castShadow>
        <cylinderGeometry args={[radius, radius, 0.014, 14]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.25} />
      </mesh>
      <mesh position-y={0.015} scale={[1, 0.3, 1]}>
        <sphereGeometry args={[radius * 0.95, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Porte des monnayeurs : deux fentes lumineuses, boutons de retour et serrure
function CoinDoor() {
  return (
    <group position={[0, 0.55, 0.325]}>
      <mesh castShadow>
        <boxGeometry args={[0.24, 0.3, 0.015]} />
        <meshStandardMaterial color={COLORS.darkMetal} metalness={0.7} roughness={0.35} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <group key={x} position-x={x}>
          <mesh position={[0, 0.06, 0.01]}>
            <boxGeometry args={[0.04, 0.06, 0.01]} />
            <meshStandardMaterial color={COLORS.coin} emissive={COLORS.coin} emissiveIntensity={2.2} />
          </mesh>
          <mesh position={[0, 0.065, 0.016]}>
            <boxGeometry args={[0.006, 0.035, 0.004]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0, -0.02, 0.012]}>
            <boxGeometry args={[0.03, 0.02, 0.01]} />
            <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {/* Trappe de retour des pièces et serrure */}
      <mesh position={[0, -0.09, 0.009]}>
        <boxGeometry args={[0.1, 0.04, 0.006]} />
        <meshStandardMaterial color="#111111" />
      </mesh>
      <mesh position={[0.085, -0.09, 0.01]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 0.008, 10]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}
