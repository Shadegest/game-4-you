import { GAME_CONFIG, PLAYER_SPAWNS } from '../../shared/constants/game.js'
import type { GameState, SerializedGameState } from '../../shared/types/game-state.js'
import type { PlayerSnapshot, Position } from '../../shared/types/player.js'
import type { LobbySnapshot } from './lobby-state.js'

export class GameRoom {
  private state: GameState | null = null

  constructor(private readonly roomId: string) { }

  createGameState(lobby: LobbySnapshot): GameState {
    const players = this.spawnPlayers(lobby.players)

    this.state = {
      roomId: this.roomId,
      phase: 'running',
      gameMode: lobby.gameMode,
      startedAt: Date.now(),
      durationMs: GAME_CONFIG.matchDurationMs,
      players,
      attacks: new Map(),
    }

    return this.state
  }

  reset(): void {
    this.state = null
  }

  getState(): GameState | null {
    return this.state
  }

  getPlayers(): Map<string, PlayerSnapshot> {
    return this.state?.players ?? new Map()
  }

  pause(now = Date.now()): boolean {
    if (!this.state || this.state.phase !== 'running') {
      return false
    }

    this.state.phase = 'paused'
    this.state.pausedAt = now
    this.state.attacks.clear()
    return true
  }

  resume(now = Date.now()): boolean {
    if (!this.state || this.state.phase !== 'paused' || !this.state.pausedAt) {
      return false
    }

    this.state.startedAt += now - this.state.pausedAt
    this.state.pausedAt = undefined
    this.state.phase = 'running'
    return true
  }

  serializeState(now = Date.now()): SerializedGameState | null {
    if (!this.state) {
      return null
    }

    const referenceTime = this.state.phase === 'paused'
      ? this.state.pausedAt ?? now
      : now
    const elapsedMs = referenceTime - this.state.startedAt
    const remainingMs = Math.max(0, this.state.durationMs - elapsedMs)

    return {
      roomId: this.state.roomId,
      phase: this.state.phase,
      gameMode: this.state.gameMode,
      startedAt: this.state.startedAt,
      durationMs: this.state.durationMs,
      pausedAt: this.state.pausedAt,
      remainingMs,
      winnerIds: this.state.winnerIds,
      players: Array.from(this.state.players.values()).map((player) => ({
        ...player,
        position: { ...player.position },
      })),
      attacks: Array.from(this.state.attacks.values()).map((attack) => ({
        ...attack,
        origin: { ...attack.origin },
      })),
    }
  }

  private spawnPlayers(players: LobbySnapshot['players']): Map<string, PlayerSnapshot> {
    const spawnedPlayers = new Map<string, PlayerSnapshot>()

    players.forEach((player, index) => {
      const spawn = PLAYER_SPAWNS[index] ?? PLAYER_SPAWNS[0]
      const position = this.toWorldPosition(spawn)

      spawnedPlayers.set(player.id, {
        id: player.id,
        name: player.name,
        position,
        score: 0,
        facingDirection: 'down',
        isInvulnerable: false,
        invulnerableUntil: 0
      })
    })

    return spawnedPlayers
  }

  private toWorldPosition(tilePosition: Position): Position {
    return {
      x: tilePosition.x * GAME_CONFIG.tileSize,
      y: tilePosition.y * GAME_CONFIG.tileSize,
    }
  }
}
