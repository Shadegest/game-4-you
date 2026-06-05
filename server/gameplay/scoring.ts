import type { GameState } from "../../shared/types/game-state.js";

export function getLeaderboard( //returns a sorted array of players based on their score, with the highest score first
    gameState: GameState,
) {
    return [...gameState.players.values()]
        .sort((a, b) => b.score - a.score)
}