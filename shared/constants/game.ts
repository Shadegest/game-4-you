export const GAME_CONFIG = {
  tileSize: 32,
  gridWidth: 20,
  gridHeight: 15,
  matchDurationMs: 60_000,
  startingScore: 0,
  attackRangeTiles: 20,
  attackDurationMs: 180,
  attackCooldownMs: 500,
  invulnerabilityDurationMs: 1000,
} as const

export const PLAYER_SPAWNS = [
  { x: 1, y: 1 },
  { x: GAME_CONFIG.gridWidth - 2, y: 1 },
  { x: 1, y: GAME_CONFIG.gridHeight - 2 },
  { x: GAME_CONFIG.gridWidth - 2, y: GAME_CONFIG.gridHeight - 2 },
] as const
