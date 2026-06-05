import type { Direction } from './attack.js';

export type Position = { x: number; y: number };

export interface PlayerSnapshot {
    id: string;
    name: string;
    position: Position;
    score: number;
    facingDirection: Direction;
    isInvulnerable: boolean;
    invulnerableUntil: number;
}
