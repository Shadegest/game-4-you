import type { GameMode } from "../../shared/types/game-state.js"

export const LOBBY_LIMITS = {
  minPlayers: 2,
  maxPlayers: 4,
  maxNameLength: 20,
} as const

export type LobbyPhase = "waiting" | "in-game"

export type LobbyPlayer = {
  id: string
  name: string
  isHost: boolean
  joinedAt: number
}

export type LobbySnapshot = {
  roomId: string
  phase: LobbyPhase
  gameMode: GameMode
  players: LobbyPlayer[]
  hostId: string | null
  canStart: boolean
}

export type JoinPlayerResult =
  | { ok: true; player: LobbyPlayer; snapshot: LobbySnapshot }
  | { ok: false; reason: JoinPlayerFailureReason }

export type JoinPlayerFailureReason =
  | "game-already-started"
  | "lobby-full"
  | "name-empty"
  | "name-too-long"
  | "name-taken"
  | "player-already-joined"

export type StartGameResult =
  | { ok: true; snapshot: LobbySnapshot }
  | { ok: false; reason: StartGameFailureReason }

export type StartGameFailureReason =
  | "already-started"
  | "not-host"
  | "not-enough-players"
  | "too-many-players"

export class LobbyState {
  private readonly roomId: string
  private readonly players = new Map<string, LobbyPlayer>()
  private phase: LobbyPhase = "waiting"
  private gameMode: GameMode = "normal"

  constructor(roomId: string) {
    this.roomId = roomId
  }

  joinPlayer(playerId: string, rawName: string): JoinPlayerResult {
    if (this.phase !== "waiting") {
      return { ok: false, reason: "game-already-started" }
    }

    if (this.players.has(playerId)) {
      return { ok: false, reason: "player-already-joined" }
    }

    if (this.players.size >= LOBBY_LIMITS.maxPlayers) {
      return { ok: false, reason: "lobby-full" }
    }

    const name = this.normalizeName(rawName)

    if (!name) {
      return { ok: false, reason: "name-empty" }
    }

    if (name.length > LOBBY_LIMITS.maxNameLength) {
      return { ok: false, reason: "name-too-long" }
    }

    if (this.isNameTaken(name)) {
      return { ok: false, reason: "name-taken" }
    }

    const player: LobbyPlayer = {
      id: playerId,
      name,
      isHost: this.players.size === 0,
      joinedAt: Date.now(),
    }

    this.players.set(player.id, player)

    return {
      ok: true,
      player: { ...player },
      snapshot: this.getSnapshot(),
    }
  }

  removePlayer(playerId: string): LobbySnapshot {
    const removedPlayer = this.players.get(playerId)
    this.players.delete(playerId)

    if (removedPlayer?.isHost) {
      this.assignHostToEarliestPlayer()
    }

    if (this.players.size === 0) {
      this.phase = "waiting"
    }

    return this.getSnapshot()
  }

  startGame(requestingPlayerId: string): StartGameResult {
    if (this.phase === "in-game") {
      return { ok: false, reason: "already-started" }
    }

    if (this.getHostId() !== requestingPlayerId) {
      return { ok: false, reason: "not-host" }
    }

    if (this.players.size < LOBBY_LIMITS.minPlayers) {
      return { ok: false, reason: "not-enough-players" }
    }

    if (this.players.size > LOBBY_LIMITS.maxPlayers) {
      return { ok: false, reason: "too-many-players" }
    }

    this.phase = "in-game"

    return {
      ok: true,
      snapshot: this.getSnapshot(),
    }
  }

  setGameMode(requestingPlayerId: string, gameMode: GameMode): { ok: boolean; reason?: string; snapshot: LobbySnapshot } {
    if (this.phase !== "waiting") {
      return { ok: false, reason: "game-already-started", snapshot: this.getSnapshot() }
    }
    if (this.getHostId() !== requestingPlayerId) {
      return { ok: false, reason: "not-host", snapshot: this.getSnapshot() }
    }
    this.gameMode = gameMode
    return { ok: true, snapshot: this.getSnapshot() }
  }

  resetToWaiting(): LobbySnapshot {
    this.phase = "waiting"
    return this.getSnapshot()
  }

  hasPlayer(playerId: string): boolean {
    return this.players.has(playerId)
  }

  isEmpty(): boolean {
    return this.players.size === 0
  }

  getSnapshot(): LobbySnapshot {
    const players = this.getPlayersInJoinOrder()

    return {
      roomId: this.roomId,
      phase: this.phase,
      gameMode: this.gameMode,
      players: players.map((player) => ({ ...player })),
      hostId: this.getHostId(),
      canStart: this.canStart(),
    }
  }

  private canStart(): boolean {
    return (
      this.phase === "waiting" &&
      this.players.size >= LOBBY_LIMITS.minPlayers &&
      this.players.size <= LOBBY_LIMITS.maxPlayers
    )
  }

  private getHostId(): string | null {
    for (const player of this.players.values()) {
      if (player.isHost) {
        return player.id
      }
    }

    return null
  }

  private assignHostToEarliestPlayer(): void {
    const nextHost = this.getPlayersInJoinOrder()[0]

    for (const player of this.players.values()) {
      player.isHost = player.id === nextHost?.id
    }
  }

  private getPlayersInJoinOrder(): LobbyPlayer[] {
    return Array.from(this.players.values()).sort(
      (firstPlayer, secondPlayer) => firstPlayer.joinedAt - secondPlayer.joinedAt,
    )
  }

  private isNameTaken(name: string): boolean {
    const normalizedName = name.toLocaleLowerCase()

    for (const player of this.players.values()) {
      if (player.name.toLocaleLowerCase() === normalizedName) {
        return true
      }
    }

    return false
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, " ")
  }
}
