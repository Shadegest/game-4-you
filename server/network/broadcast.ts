import type { WebsocketServer } from './websocket-server.js'
import type { LobbySnapshot } from '../rooms/lobby-state.js'
import type { SerializedGameState } from '../../shared/types/game-state.js'
import { serializeGameSnapshot } from '../simulation/snapshot.js'
import { RhythmSystem } from '../gameplay/rhythm.js'

export function broadcastGameState(
    server: WebsocketServer,
    state: SerializedGameState
): void {
    const snapshot = serializeGameSnapshot(state)
    const now = Date.now()
    const beatTiming = new RhythmSystem().getBeatTiming(now, state.startedAt)

    server.broadcast({
        type: 'state_update',
        players: snapshot.players,
        attacks: snapshot.attacks,
        timer: snapshot.remainingMs,
        beatState: state.gameMode === 'beat' ? {
            beatIndex: beatTiming.beatIndex,
            beatProgress: beatTiming.beatProgress,
            serverTime: now,
        } : undefined
    })
}

export function broadcastLobbyState(
    server: WebsocketServer,
    snapshot: LobbySnapshot
): void {
    server.broadcast({
        type: 'lobby_state',
        roomId: snapshot.roomId,
        phase: snapshot.phase,
        gameMode: snapshot.gameMode,
        hostId: snapshot.hostId,
        canStart: snapshot.canStart,
        players: snapshot.players.map((player) => ({
            id: player.id,
            name: player.name,
            isHost: player.isHost,
        })),
    })
}

export function broadcastGameStarted(
    server: WebsocketServer,
    initialState: SerializedGameState
): void {
    server.broadcast({
        type: 'game_started',
        initialState,
    })
}
