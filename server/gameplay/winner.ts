import type { GameState } from "../../shared/types/game-state.js";

export function calculateWinner(
    gameState: GameState,
) {
    const players = [...gameState.players.values()]

    if (players.length === 0) {
        return []
    }

    const highestScore = Math.max(
        ...players.map(player => player.score)
    )

    return players.filter(player => player.score === highestScore)
}