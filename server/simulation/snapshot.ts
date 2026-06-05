import type { SerializedGameState } from '../../shared/types/game-state.js'

export function serializeGameSnapshot(state: SerializedGameState): SerializedGameState {
  return {
    ...state,
    players: state.players.map((player) => ({
      ...player,
      position: { ...player.position },
    })),
    attacks: state.attacks.map((attack) => ({
      ...attack,
      origin: { ...attack.origin },
    })),
  }
}
