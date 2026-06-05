import { simulateMovementTick, simulateCombatTick } from "./tick.js";
import { broadcastGameState } from "../network/broadcast.js";
import type { WebsocketServer } from "../network/websocket-server.js";
import type { GameRoom } from "../rooms/game-room.js";
import { calculateWinner } from "../gameplay/winner.js";

const TICK_RATE = 1000 / 60;

export type GameLoopController = {
    stop: () => void
}

export function startGameLoop(
    server: WebsocketServer,
    gameRoom: GameRoom
): GameLoopController {
    const interval = setInterval(() => {
        const state = gameRoom.getState()

        if (!state || state.phase !== 'running') {
            return
        }

        const elapsedMs = Date.now() - state.startedAt

        if (elapsedMs >= state.durationMs) {
            const winners = calculateWinner(state)

            state.winnerIds = winners.map(
                player => player.id
            )

            state.phase = 'finished'

            const updatedState = gameRoom.serializeState()

            if (updatedState) {
                broadcastGameState(server, updatedState);
            }

            console.log(
                'Match finished. Winners:',
                winners.map(player => player.name)
            )

            return
        }

        simulateMovementTick(state.players);
        simulateCombatTick(state.players, state.attacks, state.startedAt, state.gameMode);

        const updatedState = gameRoom.serializeState()

        if (updatedState) {
            broadcastGameState(server, updatedState);
        }
    }, TICK_RATE);

    return {
        stop: () => clearInterval(interval),
    }
}
