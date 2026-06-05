import { GAME_CONFIG } from '../../shared/constants/game.js'
import type { AttackSnapshot } from '../../shared/types/attack.js'
import type { PlayerInput } from '../../shared/types/input.js'
import type { PlayerSnapshot } from '../../shared/types/player.js'
import type { GameMode } from '../../shared/types/game-state.js'
import { RhythmSystem } from './rhythm.js'

const attackHeldPlayers = new Set<string>()
const attackCooldownUntil = new Map<string, number>()
let nextAttackId = 1

export function processPlayerAttack(
  player: PlayerSnapshot,
  input: PlayerInput,
  attacks: Map<string, AttackSnapshot>,
  now = Date.now(),
  startedAt?: number,
  gameMode?: GameMode,
): void {
  if (!input.attack) {
    attackHeldPlayers.delete(player.id)
    return
  }

  if (attackHeldPlayers.has(player.id)) {
    return
  }

  if (!canAttack(player.id, now)) {
    return
  }

  attackHeldPlayers.add(player.id)

  let rhythmRating: 'perfect' | 'good' | undefined

  if (gameMode === 'beat' && startedAt !== undefined) {
    let attackTime = now;
    if (input.timestamp !== undefined) {
      // Sanity check: input timestamp must be within a reasonable window of current server time (e.g. ±500ms)
      if (Math.abs(now - input.timestamp) <= 500) {
        attackTime = input.timestamp;
      }
    }

    const validation = new RhythmSystem().validateTiming(attackTime, startedAt)
    if (!validation.isValid) {
      applyAttackCooldown(player.id, now)
      return
    }

    if (validation.rating === 'perfect' || validation.rating === 'good') {
      rhythmRating = validation.rating
    }

  }

  applyAttackCooldown(player.id, now)
  const attack = performAttack(player, now, rhythmRating)
  attacks.set(attack.id, attack)
}

export function pruneExpiredAttacks(
  attacks: Map<string, AttackSnapshot>,
  now = Date.now(),
): void {
  for (const [attackId, attack] of attacks) {
    if (attack.expiresAt <= now) {
      attacks.delete(attackId)
    }
  }
}

export function performAttack(
  player: PlayerSnapshot,
  now = Date.now(),
  rhythmRating?: 'perfect' | 'good'
): AttackSnapshot {
  return {
    id: createAttackId(),
    attackerId: player.id,
    direction: getAttackDirection(player),
    origin: { ...player.position },
    range: GAME_CONFIG.attackRangeTiles * GAME_CONFIG.tileSize,
    createdAt: now,
    expiresAt: now + GAME_CONFIG.attackDurationMs,
    rhythmRating,
  }
}

export function getAttackDirection(player: PlayerSnapshot): AttackSnapshot['direction'] {
  return player.facingDirection
}

export function canAttack(playerId: string, now = Date.now()): boolean {
  return now >= (attackCooldownUntil.get(playerId) ?? 0)
}

export function applyAttackCooldown(playerId: string, now = Date.now()): void {
  attackCooldownUntil.set(playerId, now + GAME_CONFIG.attackCooldownMs)
}

export function clearAttackState(playerId: string): void {
  attackHeldPlayers.delete(playerId)
  attackCooldownUntil.delete(playerId)
}

function createAttackId(): string {
  const attackId = `attack_${nextAttackId}`
  nextAttackId += 1
  return attackId
}
