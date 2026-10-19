import { Bedroom } from './arcade/Bedroom'
import { Cabinet } from './arcade/Cabinet'
import { CameraDirector } from './arcade/CameraDirector'
import { DustMotes } from './arcade/DustMotes'
import { RoomLights } from './arcade/RoomLights'
import { GameLoop } from './GameLoop'

// La pièce : une chambre avec la borne d'arcade, dont l'écran affiche le jeu (voir GameWorld).
export function GameScene() {
  return (
    <>
      <GameLoop />
      <color attach="background" args={['#05040a']} />
      <CameraDirector />
      <RoomLights />
      <Bedroom />
      <Cabinet />
      <DustMotes />
    </>
  )
}
