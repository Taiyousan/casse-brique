import { useCheats } from '../game/cheats'
import { FIELD } from '../game/constants'
import { GOD_FLOOR_Y } from '../game/simulation'

// God mode « mort impossible » : plancher lumineux sur lequel la balle rebondit
export function GodFloor() {
  const visible = useCheats((s) => s.enabled && s.invincible)
  return (
    <mesh position={[0, GOD_FLOOR_Y - 0.06, 0]} visible={visible}>
      <boxGeometry args={[FIELD.width, 0.12, 0.3]} />
      <meshStandardMaterial color="#ffd23f" emissive="#ffd23f" emissiveIntensity={2.5} />
    </mesh>
  )
}
