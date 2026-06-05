import type { AttackSnapshot } from '../types/attack';
import type { PlayerSnapshot } from '../types/player';
import type { SerializedGameState } from '../types/game-state';

export type ServerMessage = 
    | { type: 'init'; playerId: string; isLeader: boolean }
    | {
        type: 'lobby_state';
        roomId: string;
        phase: 'waiting' | 'in-game';
        gameMode: 'normal' | 'beat';
        hostId: string | null;
        canStart: boolean;
        players: { id: string; name: string; isHost: boolean }[];
    }
    | { type: 'game_started'; initialState: SerializedGameState }
    | {
        type: 'state_update';
        players: PlayerSnapshot[];
        attacks: AttackSnapshot[];
        timer: number;
        beatState?: {
            beatIndex: number;
            beatProgress: number;
            serverTime: number;
        };
    }
    | { type: 'pong'; clientTime: number; serverTime: number }
    | { type: 'player_joined'; player: PlayerSnapshot }
    | { type: 'player_left'; playerId: string; playerName?: string }
    | { type: 'game_paused'; byPlayerName: string }
    | { type: 'game_resumed'; byPlayerName: string }
    | { type: 'game_over'; winnerId: string | null }
    | { type: 'game_aborted' }
    | { type: 'error'; message: string };
