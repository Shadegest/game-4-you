import { LobbyState, type LobbySnapshot } from "./lobby-state.js"

export type CreateRoomResult = {
  roomId: string
  room: LobbyState
}

export class RoomManager {
  private readonly rooms = new Map<string, LobbyState>()

  createRoom(roomId = this.createRoomId()): CreateRoomResult {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room already exists: ${roomId}`)
    }

    const room = new LobbyState(roomId)
    this.rooms.set(roomId, room)

    return { roomId, room }
  }

  getRoom(roomId: string): LobbyState | null {
    return this.rooms.get(roomId) ?? null
  }

  getOrCreateRoom(roomId: string): LobbyState {
    const existingRoom = this.getRoom(roomId)

    if (existingRoom) {
      return existingRoom
    }

    return this.createRoom(roomId).room
  }

  removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId)
  }

  removeRoomIfEmpty(roomId: string): boolean {
    const room = this.getRoom(roomId)

    if (!room || !room.isEmpty()) {
      return false
    }

    return this.removeRoom(roomId)
  }

  findRoomByPlayerId(playerId: string): LobbyState | null {
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(playerId)) {
        return room
      }
    }

    return null
  }

  getSnapshots(): LobbySnapshot[] {
    return Array.from(this.rooms.values()).map((room) => room.getSnapshot())
  }

  getRoomCount(): number {
    return this.rooms.size
  }

  private createRoomId(): string {
    let roomId = this.generateRoomId()

    while (this.rooms.has(roomId)) {
      roomId = this.generateRoomId()
    }

    return roomId
  }

  private generateRoomId(): string {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  }
}
