import type { AttackSnapshot } from './attack.js'
import type { PlayerSnapshot } from './player.js'

export type MatchPhase = 'not-started' | 'running' | 'paused' | 'finished'

export type GameMode = 'normal' | 'beat'

export type GameState = {
  roomId: string
  phase: MatchPhase
  gameMode: GameMode
  startedAt: number
  durationMs: number
  pausedAt?: number
  winnerIds?: string[]
  players: Map<string, PlayerSnapshot>
  attacks: Map<string, AttackSnapshot>
}

export type SerializedGameState = {
  roomId: string
  phase: MatchPhase
  gameMode: GameMode
  startedAt: number
  durationMs: number
  pausedAt?: number
  remainingMs: number
  winnerIds?: string[]
  players: PlayerSnapshot[]
  attacks: AttackSnapshot[]
}
