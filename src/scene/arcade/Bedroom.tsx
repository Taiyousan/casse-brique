import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { CatmullRomCurve3, type Group, type Mesh, Vector3 } from 'three'
import {
  floorTexture,
  nightSkyTexture,
  pcScreenTexture,
  posterInvaderTexture,
  posterSunsetTexture,
  tvScreenTexture,
  wallpaperTexture,
} from './canvasTextures'
import { ROOM } from './layout'
import { QUALITY } from '../quality'
import { createRainyWindowMaterial } from './rainyWindowMaterial'

const COLORS = {
  wall: '#6a62a8',
  wallStripe: '#615a9c',
  wallSide: '#7068b0',
  wallSideStripe: '#665ea3',
  baseboard: '#e8e2d0',
  rug: '#2f8fa8',
  rugBorder: '#ff5fd2',
  windowFrame: '#f2ecdc',
  curtain: '#c43d6b',
  wood: '#9a6a48',
  woodDark: '#6f4a32',
  bedFrame: '#4d3878',
  mattress: '#eef1f8',
  blanket: '#ff8f5a',
  blanketStripe: '#ffd23f',
  pillow: '#ffffff',
  beige: '#d9cfb4',
  lampShade: '#ffd27a',
  metal: '#9aa0ab',
  books: ['#e63946', '#ffd23f', '#2a9d8f', '#5fa8d3', '#9d79bc', '#f4a261'],
  bulbs: ['#ffd27a', '#ff6fb5', '#7ad7ff', '#9dff8a'],
}

const BACK_Z = ROOM.backZ
const LEFT_X = ROOM.leftX
const CENTER_Z = BACK_Z + ROOM.depth / 2

// Chambre d'ado des années 90, la nuit : la borne est contre le mur du fond.
export function Bedroom() {
  return (
    <group>
      <Shell />
      <Rug />
      <Window />
      <TvCorner />
      <Bed />
      <Nightstand />
      <Desk />
      <Shelf />
      <Posters />
      <WallClock />
      <StringLights />
      <Beanbag />
    </group>
  )
}

// Sol, murs et plinthes
function Shell() {
  const textures = useMemo(() => {
    const floor = floorTexture()
    floor.repeat.set(ROOM.width / 2, ROOM.depth / 2)
    const back = wallpaperTexture(COLORS.wall, COLORS.wallStripe)
    back.repeat.set(ROOM.width / 0.8, ROOM.height / 0.8)
    const side = wallpaperTexture(COLORS.wallSide, COLORS.wallSideStripe)
    side.repeat.set(ROOM.depth / 0.8, ROOM.height / 0.8)
    return { floor, back, side }
  }, [])

  return (
    <>
      <mesh position={[0, -0.025, CENTER_Z]} receiveShadow>
        <boxGeometry args={[ROOM.width, 0.05, ROOM.depth]} />
        <meshStandardMaterial map={textures.floor} roughness={0.7} />
      </mesh>
      <mesh position={[0, ROOM.height / 2, BACK_Z - 0.025]} receiveShadow>
        <boxGeometry args={[ROOM.width, ROOM.height, 0.05]} />
        <meshStandardMaterial map={textures.back} roughness={0.9} />
      </mesh>
      <mesh position={[LEFT_X - 0.025, ROOM.height / 2, CENTER_Z]} receiveShadow>
        <boxGeometry args={[0.05, ROOM.height, ROOM.depth]} />
        <meshStandardMaterial map={textures.side} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.05, BACK_Z + 0.01]}>
        <boxGeometry args={[ROOM.width, 0.1, 0.02]} />
        <meshStandardMaterial color={COLORS.baseboard} />
      </mesh>
      <mesh position={[LEFT_X + 0.01, 0.05, CENTER_Z]}>
        <boxGeometry args={[0.02, 0.1, ROOM.depth]} />
        <meshStandardMaterial color={COLORS.baseboard} />
      </mesh>
    </>
  )
}

function Rug() {
  return (
    <group position={[0.15, 0.002, 1.25]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.15, 1.15, 0.01, 10]} />
        <meshStandardMaterial color={COLORS.rugBorder} roughness={1} />
      </mesh>
      <mesh position-y={0.002} receiveShadow>
        <cylinderGeometry args={[1.02, 1.02, 0.01, 10]} />
        <meshStandardMaterial color={COLORS.rug} roughness={1} />
      </mesh>
      <mesh position-y={0.004} receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.01, 10]} />
        <meshStandardMaterial color="#ffd23f" roughness={1} />
      </mesh>
    </group>
  )
}

const WINDOW = { x: -1.55, y: 1.55, width: 1.1, height: 1.0 }

function Window() {
  const { width, height } = WINDOW
  const glass = useMemo(() => createRainyWindowMaterial(nightSkyTexture(), width / height), [width, height])
  useFrame(({ clock }) => {
    glass.uniforms.time.value = clock.elapsedTime
  })
  const frame = 0.05
  return (
    <group position={[WINDOW.x, WINDOW.y, BACK_Z + 0.005]}>
      {/* Vue sur la ville sous la pluie : lumineuse, insensible à l'éclairage de la pièce */}
      <mesh material={glass}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Cadre et croisillons */}
      {[
        [0, height / 2, width + frame, frame],
        [0, -height / 2, width + frame, frame],
        [-width / 2, 0, frame, height + frame],
        [width / 2, 0, frame, height + frame],
        [0, 0, frame * 0.6, height],
        [0, 0, width, frame * 0.6],
      ].map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0.02]} castShadow>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color={COLORS.windowFrame} roughness={0.6} />
        </mesh>
      ))}
      {/* Rebord */}
      <mesh position={[0, -height / 2 - 0.04, 0.07]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.2, 0.04, 0.16]} />
        <meshStandardMaterial color={COLORS.windowFrame} />
      </mesh>
      {/* Tringle et rideaux ondulés, de part et d'autre */}
      <mesh position={[0, height / 2 + 0.12, 0.1]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, width + 0.7, 8]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.7} roughness={0.3} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (width / 2 + 0.17), -0.05, 0.1]}>
          {[0, 1, 2, 3].map((fold) => (
            <mesh key={fold} position={[(fold - 1.5) * 0.065, 0, Math.sin(fold * 2.1) * 0.02]} castShadow>
              <boxGeometry args={[0.07, height + 0.3, 0.025]} />
              <meshStandardMaterial color={COLORS.curtain} roughness={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// Sous la fenêtre : meuble bas, télévision cathodique, console et cassettes
function TvCorner() {
  const screen = useMemo(tvScreenTexture, [])
  return (
    <group position={[WINDOW.x, 0, BACK_Z + 0.25]}>
      <mesh position-y={0.2} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.4, 0.45]} />
        <meshStandardMaterial color={COLORS.woodDark} roughness={0.7} />
      </mesh>
      {/* Portes du meuble */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.228]}>
          <boxGeometry args={[0.4, 0.34, 0.01]} />
          <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
        </mesh>
      ))}

      {/* Télévision */}
      <group position={[-0.08, 0.4, -0.02]}>
        <mesh position-y={0.17} castShadow receiveShadow>
          <boxGeometry args={[0.46, 0.34, 0.36]} />
          <meshStandardMaterial color="#2b2b30" roughness={0.5} />
        </mesh>
        <mesh position={[-0.04, 0.18, 0.181]}>
          <planeGeometry args={[0.32, 0.25]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        {[0.06, 0.12].map((y) => (
          <mesh key={y} position={[0.18, y + 0.1, 0.182]}>
            <circleGeometry args={[0.015, 10]} />
            <meshStandardMaterial color="#888888" metalness={0.6} />
          </mesh>
        ))}
        {/* Antenne */}
        {[-0.5, 0.5].map((tilt) => (
          <mesh key={tilt} position={[tilt * 0.1, 0.48, -0.05]} rotation-z={tilt}>
            <cylinderGeometry args={[0.004, 0.004, 0.3, 4]} />
            <meshStandardMaterial color={COLORS.metal} metalness={0.8} />
          </mesh>
        ))}
      </group>

      {/* Console et sa manette */}
      <mesh position={[0.3, 0.43, 0.05]} castShadow>
        <boxGeometry args={[0.22, 0.05, 0.18]} />
        <meshStandardMaterial color="#c8c8cc" roughness={0.5} />
      </mesh>
      <mesh position={[0.26, 0.46, 0.05]}>
        <boxGeometry args={[0.07, 0.01, 0.05]} />
        <meshStandardMaterial color="#555560" />
      </mesh>
      <group position={[0.25, 0.012, 0.55]} rotation-y={0.4}>
        <mesh castShadow>
          <boxGeometry args={[0.14, 0.025, 0.06]} />
          <meshStandardMaterial color="#c8c8cc" roughness={0.5} />
        </mesh>
        {['#e63946', '#3ab8ff'].map((color, i) => (
          <mesh key={color} position={[0.035 + i * 0.022, 0.015, 0]}>
            <cylinderGeometry args={[0.008, 0.008, 0.006, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>

      {/* Pile de cassettes vidéo */}
      {['#222222', '#3a3a3a', '#222222'].map((color, i) => (
        <mesh key={i} position={[0.32, 0.47 + i * 0.03 + 0.03, -0.1]} rotation-y={i * 0.15 - 0.1} castShadow>
          <boxGeometry args={[0.19, 0.028, 0.105]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}

function Bed() {
  return (
    <group position={[LEFT_X + 0.55, 0, 1.55]}>
      <mesh position-y={0.17} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.34, 2.0]} />
        <meshStandardMaterial color={COLORS.bedFrame} />
      </mesh>
      <mesh position-y={0.42} castShadow receiveShadow>
        <boxGeometry args={[0.94, 0.16, 1.94]} />
        <meshStandardMaterial color={COLORS.mattress} roughness={0.9} />
      </mesh>
      {/* Couverture rayée, sur les deux tiers du lit */}
      <mesh position={[0.02, 0.51, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.04, 1.3]} />
        <meshStandardMaterial color={COLORS.blanket} roughness={0.9} />
      </mesh>
      {[-0.3, 0.1, 0.5, 0.9].map((z) => (
        <mesh key={z} position={[0.02, 0.532, z]}>
          <boxGeometry args={[1.005, 0.005, 0.08]} />
          <meshStandardMaterial color={COLORS.blanketStripe} roughness={0.9} />
        </mesh>
      ))}
      <mesh position={[0, 0.55, -0.72]} rotation-x={-0.15} castShadow>
        <boxGeometry args={[0.6, 0.1, 0.32]} />
        <meshStandardMaterial color={COLORS.pillow} roughness={1} />
      </mesh>
      {/* Tête de lit */}
      <mesh position={[0, 0.5, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 1.0, 0.06]} />
        <meshStandardMaterial color={COLORS.bedFrame} />
      </mesh>
    </group>
  )
}

// Table de nuit, avec une lampe à lave dont les bulles montent et descendent
function Nightstand() {
  const blobs = useRef<(Mesh | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    blobs.current.forEach((blob, i) => {
      if (!blob) return
      blob.position.y = 0.2 + Math.sin(t * 0.5 + i * 2.1) * 0.08
      blob.scale.setScalar(1 + Math.sin(t * 0.8 + i) * 0.2)
    })
  })

  return (
    <group position={[LEFT_X + 0.3, 0, 0.25]}>
      <mesh position-y={0.25} castShadow receiveShadow>
        <boxGeometry args={[0.45, 0.5, 0.4]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>
      <mesh position={[0.226, 0.32, 0]}>
        <boxGeometry args={[0.01, 0.14, 0.32]} />
        <meshStandardMaterial color={COLORS.woodDark} />
      </mesh>

      <group position={[0, 0.5, 0.02]}>
        <mesh position-y={0.04} castShadow>
          <cylinderGeometry args={[0.035, 0.06, 0.08, 10]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position-y={0.2}>
          <capsuleGeometry args={[0.045, 0.18, 4, 12]} />
          <meshStandardMaterial color="#ff4f8b" emissive="#ff4f8b" emissiveIntensity={0.9} transparent opacity={0.75} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            ref={(m) => {
              blobs.current[i] = m
            }}
            position-y={0.2}
          >
            <sphereGeometry args={[0.022, 10, 8]} />
            <meshStandardMaterial color="#ffd23f" emissive="#ffb000" emissiveIntensity={1.5} />
          </mesh>
        ))}
        <mesh position-y={0.36} castShadow>
          <cylinderGeometry args={[0.02, 0.035, 0.05, 10]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.8} roughness={0.25} />
        </mesh>
        {QUALITY.extraLights && <pointLight position-y={0.22} color="#ff6f8a" intensity={0.6} distance={1.8} decay={2} />}
      </group>
    </group>
  )
}

function Desk() {
  const pcScreen = useMemo(pcScreenTexture, [])
  const legs: [number, number][] = [
    [-0.56, -0.26],
    [0.56, -0.26],
    [-0.56, 0.26],
    [0.56, 0.26],
  ]
  return (
    <group position={[1.6, 0, BACK_Z + 0.33]}>
      <mesh position-y={0.74} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.6]} />
        <meshStandardMaterial color={COLORS.wood} roughness={0.7} />
      </mesh>
      {legs.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color={COLORS.woodDark} />
        </mesh>
      ))}

      {/* Ordinateur beige des années 90 : écran cathodique, clavier, souris */}
      <group position={[-0.2, 0.76, -0.08]}>
        <mesh position-y={0.02} castShadow>
          <boxGeometry args={[0.36, 0.04, 0.3]} />
          <meshStandardMaterial color={COLORS.beige} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.2, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.3, 0.3]} />
          <meshStandardMaterial color={COLORS.beige} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.2, 0.131]}>
          <planeGeometry args={[0.26, 0.2]} />
          <meshBasicMaterial map={pcScreen} toneMapped={false} />
        </mesh>
        <mesh position={[0.02, 0.012, 0.3]} rotation-x={0.05} castShadow>
          <boxGeometry args={[0.38, 0.02, 0.13]} />
          <meshStandardMaterial color={COLORS.beige} roughness={0.6} />
        </mesh>
        <mesh position={[0.3, 0.012, 0.3]} castShadow>
          <boxGeometry args={[0.05, 0.02, 0.08]} />
          <meshStandardMaterial color={COLORS.beige} roughness={0.6} />
        </mesh>
      </group>
      {QUALITY.extraLights && (
        <pointLight position={[-0.2, 0.98, 0.15]} color="#5fe0d0" intensity={0.25} distance={1.2} decay={2} />
      )}

      {/* Lampe de bureau : la lumière chaude de la pièce part de son abat-jour (voir RoomLights) */}
      <group position={[0.42, 0.76, -0.1]}>
        <mesh position-y={0.015} castShadow>
          <cylinderGeometry args={[0.08, 0.09, 0.03, 10]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 6]} />
          <meshStandardMaterial color={COLORS.metal} metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-0.05, 0.42, 0.02]} rotation-z={0.5} castShadow>
          <coneGeometry args={[0.1, 0.14, 10, 1, true]} />
          <meshStandardMaterial color={COLORS.lampShade} emissive={COLORS.lampShade} emissiveIntensity={0.8} side={2} />
        </mesh>
      </group>

      {/* Canette */}
      <mesh position={[0.18, 0.82, 0.16]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.12, 12]} />
        <meshStandardMaterial color="#e63946" metalness={0.6} roughness={0.3} />
      </mesh>

      <Chair />
    </group>
  )
}

function Chair() {
  return (
    <group position={[-0.1, 0, 0.65]} rotation-y={0.5}>
      <mesh position-y={0.46} castShadow receiveShadow>
        <boxGeometry args={[0.44, 0.06, 0.42]} />
        <meshStandardMaterial color="#e63946" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.75, 0.2]} castShadow>
        <boxGeometry args={[0.42, 0.5, 0.05]} />
        <meshStandardMaterial color="#e63946" roughness={0.6} />
      </mesh>
      <mesh position-y={0.23} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.44, 6]} />
        <meshStandardMaterial color={COLORS.metal} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Piètement à cinq branches */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position-y={0.03} rotation-y={(i / 5) * Math.PI * 2}>
          <boxGeometry args={[0.03, 0.03, 0.5]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      ))}
    </group>
  )
}

function Shelf() {
  const books = useMemo(() => {
    let x = -0.42
    return COLORS.books.concat(COLORS.books.slice(0, 3)).map((color, i) => {
      const width = 0.04 + ((i * 7) % 4) * 0.012
      const height = 0.18 + ((i * 5) % 3) * 0.03
      const book = { color, x: x + width / 2, width, height, tilt: i === 6 ? 0.25 : 0 }
      x += width + 0.008
      return book
    })
  }, [])

  return (
    <group position={[1.6, 1.62, BACK_Z + 0.12]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.03, 0.22]} />
        <meshStandardMaterial color={COLORS.wood} />
      </mesh>
      {books.map((book, i) => (
        <mesh key={i} position={[book.x, 0.015 + book.height / 2, 0]} rotation-z={book.tilt} castShadow>
          <boxGeometry args={[book.width, book.height, 0.16]} />
          <meshStandardMaterial color={book.color} roughness={0.8} />
        </mesh>
      ))}
      {/* Petite plante et une figurine de robot */}
      <mesh position={[0.36, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.04, 0.1, 6]} />
        <meshStandardMaterial color="#c4553a" />
      </mesh>
      <mesh position={[0.36, 0.2, 0]} castShadow>
        <icosahedronGeometry args={[0.09, 0]} />
        <meshStandardMaterial color="#5d9c59" flatShading />
      </mesh>
      <group position={[0.18, 0.015, 0]}>
        <mesh position-y={0.05} castShadow>
          <boxGeometry args={[0.06, 0.07, 0.04]} />
          <meshStandardMaterial color="#c9d1e0" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position-y={0.11} castShadow>
          <boxGeometry args={[0.05, 0.04, 0.04]} />
          <meshStandardMaterial color="#c9d1e0" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.115, 0.021]}>
          <boxGeometry args={[0.035, 0.01, 0.002]} />
          <meshStandardMaterial color="#2de2e6" emissive="#2de2e6" emissiveIntensity={2} />
        </mesh>
      </group>
    </group>
  )
}

function Posters() {
  const sunset = useMemo(posterSunsetTexture, [])
  const invader = useMemo(posterInvaderTexture, [])
  return (
    <>
      <mesh position={[0.95, 1.5, BACK_Z + 0.003]} rotation-z={-0.03}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial map={sunset} roughness={0.9} />
      </mesh>
      <mesh position={[LEFT_X + 0.003, 1.6, 1.0]} rotation-y={Math.PI / 2} rotation-z={0.04}>
        <planeGeometry args={[0.5, 0.7]} />
        <meshStandardMaterial map={invader} roughness={0.9} />
      </mesh>
    </>
  )
}

// Horloge murale à aiguilles, réglée sur l'heure réelle
function WallClock() {
  const hours = useRef<Group>(null)
  const minutes = useRef<Group>(null)
  useFrame(() => {
    const now = new Date()
    const m = now.getMinutes() + now.getSeconds() / 60
    const h = (now.getHours() % 12) + m / 60
    minutes.current!.rotation.z = -(m / 60) * Math.PI * 2
    hours.current!.rotation.z = -(h / 12) * Math.PI * 2
  })

  return (
    <group position={[-0.68, 2.2, BACK_Z + 0.02]}>
      <mesh rotation-x={Math.PI / 2} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.03, 20]} />
        <meshStandardMaterial color="#ff3cac" roughness={0.4} />
      </mesh>
      <mesh position-z={0.016}>
        <circleGeometry args={[0.135, 20]} />
        <meshStandardMaterial color="#fff8ec" />
      </mesh>
      {/* Repères des heures */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.11, Math.cos((i / 12) * Math.PI * 2) * 0.11, 0.018]}>
          <circleGeometry args={[i % 3 === 0 ? 0.009 : 0.005, 6]} />
          <meshStandardMaterial color="#2a1748" />
        </mesh>
      ))}
      <group ref={hours} position-z={0.02}>
        <mesh position-y={0.035}>
          <boxGeometry args={[0.012, 0.07, 0.004]} />
          <meshStandardMaterial color="#2a1748" />
        </mesh>
      </group>
      <group ref={minutes} position-z={0.024}>
        <mesh position-y={0.05}>
          <boxGeometry args={[0.008, 0.1, 0.004]} />
          <meshStandardMaterial color="#2a1748" />
        </mesh>
      </group>
    </group>
  )
}

// Guirlande lumineuse accrochée en festons en haut du mur du fond
function StringLights() {
  const { curve, bulbs } = useMemo(() => {
    const points: Vector3[] = []
    const left = -2.9
    const right = 2.4
    const swags = 4
    for (let i = 0; i <= swags * 8; i++) {
      const t = i / (swags * 8)
      const x = left + (right - left) * t
      // Chaque feston pend entre deux points d'accroche
      const sag = Math.sin(t * swags * Math.PI) ** 2 * 0.18
      points.push(new Vector3(x, 2.62 - sag, BACK_Z + 0.04))
    }
    const curve = new CatmullRomCurve3(points)
    // Les ampoules pendent juste sous le fil
    const bulbs = Array.from({ length: 26 }, (_, i) => ({
      position: curve.getPoint((i + 0.5) / 26).add(new Vector3(0, -0.025, 0)),
      color: COLORS.bulbs[i % COLORS.bulbs.length],
    }))
    return { curve, bulbs }
  }, [])

  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, 120, 0.004, 4, false]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {bulbs.map((bulb, i) => (
        <mesh key={i} position={bulb.position}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <meshStandardMaterial color={bulb.color} emissive={bulb.color} emissiveIntensity={2.5} />
        </mesh>
      ))}
    </group>
  )
}

// Pouf posé sur le tapis
function Beanbag() {
  return (
    <group position={[-1.0, 0, 1.15]} rotation-y={0.6}>
      <mesh position-y={0.22} scale={[1.15, 0.7, 1]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.36, 2]} />
        <meshStandardMaterial color="#2de2a6" roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.05, 0.36, -0.12]} scale={[0.9, 0.5, 0.7]} castShadow>
        <icosahedronGeometry args={[0.3, 2]} />
        <meshStandardMaterial color="#2de2a6" roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}
