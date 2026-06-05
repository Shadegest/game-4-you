import { PlayerInput } from '../types/input';

export type ClientMessage =
    | { type: 'join'; name: string }
    | { type: 'start_game' }
    | { type: 'set_game_mode'; gameMode: 'normal' | 'beat' }
    | { type: 'pause' }
    | { type: 'resume' }
    | { type: 'quit' }
    | { type: 'leave_game' }
    | { type: 'player_input'; input: PlayerInput }
    | { type: 'ping'; clientTime: number
    };

