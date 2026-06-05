import type { Position } from './player.js'

export type Direction = 'up' | 'down' | 'left' | 'right'

export type AttackSnapshot = {
  id: string
  attackerId: string
  direction: Direction
  origin: Position
  range: number
  rhythmRating?: 'perfect' | 'good'
  createdAt: number
  expiresAt: number
}
