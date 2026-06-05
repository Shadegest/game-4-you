import type { AttackSnapshot } from "../../shared/types/attack.js";
import type { PlayerSnapshot } from "../../shared/types/player.js";
import { GAME_CONFIG } from "../../shared/constants/game.js";

//which players have already been hit by each attack to prevent repeated hits
const hitHistory = new Map<string, Set<string>>();

//Detects if an attack collides with a player.
//Also validates the attack range as part of the collision box check.

export function detectAttackCollision(
    attack: AttackSnapshot,
    player: PlayerSnapshot,
    tileSize = GAME_CONFIG.tileSize
): boolean {
    // A player cannot hit themselves
    if (attack.attackerId === player.id) {
        return false;
    }

    const { x, y } = attack.origin;
    const range = attack.range;

    let attackMinX = 0;
    let attackMaxX = 0;
    let attackMinY = 0;
    let attackMaxY = 0;

    // Calculate attack bounding box based on direction
    switch (attack.direction) {
        case "left":
            attackMinX = x - range;
            attackMaxX = x;
            attackMinY = y;
            attackMaxY = y + tileSize;
            break;
        case "right":
            attackMinX = x + tileSize;
            attackMaxX = x + tileSize + range;
            attackMinY = y;
            attackMaxY = y + tileSize;
            break;
        case "up":
            attackMinX = x;
            attackMaxX = x + tileSize;
            attackMinY = y - range;
            attackMaxY = y;
            break;
        case "down":
            attackMinX = x;
            attackMaxX = x + tileSize;
            attackMinY = y + tileSize;
            attackMaxY = y + tileSize + range;
            break;
        default:
            return false;
    }

    // Player bounding box (AABB)
    const playerMinX = player.position.x;
    const playerMaxX = player.position.x + tileSize;
    const playerMinY = player.position.y;
    const playerMaxY = player.position.y + tileSize;

    // Standard AABB intersection check.
    // The bounding box size along the direction of attack is exactly its range,
    // which validates that the collision only occurs within the attack range.
    return (
        attackMinX < playerMaxX &&
        attackMaxX > playerMinX &&
        attackMinY < playerMaxY &&
        attackMaxY > playerMinY
    );
}

function getScoreForAttack(
    attack: AttackSnapshot
): number {
    switch (attack.rhythmRating) {
        case 'perfect':
            return 2

        case 'good':
            return 1

        default:
            return 1
    }
}

//Processes hit detection for all active attacks and applies damage to valid targets.

export function processHitDetection(
    attacks: Map<string, AttackSnapshot>,
    players: Map<string, PlayerSnapshot>
): void {
    for (const attack of attacks.values()) {
        if (!hitHistory.has(attack.id)) {
            hitHistory.set(attack.id, new Set());
        }

        const hitPlayers = hitHistory.get(attack.id)!;

        const attacker = players.get(attack.attackerId);

        for (const player of players.values()) {
            if (player.id === attack.attackerId) {
                continue;
            }

            if (isPlayerInvulnerable(player)) {
                continue;
            }

            // Detect collision (validates bounds/range)
            if (detectAttackCollision(attack, player)) {
                // Register hit to prevent repeated hits
                hitPlayers.add(player.id);

                if (attacker) {
                    attacker.score += getScoreForAttack(attack)
                }

                applyInvulnerability(
                    player,
                    GAME_CONFIG.invulnerabilityDurationMs
                ); // Example: 1 second of invulnerability after being hit
            }
        }
    }

    // 2. Clean up hit history for expired/removed attacks
    for (const attackId of hitHistory.keys()) {
        if (!attacks.has(attackId)) {
            hitHistory.delete(attackId);
        }
    }
}

export function clearHitHistory(): void {
    hitHistory.clear();
}

export function applyInvulnerability(
    player: PlayerSnapshot,
    durationMs: number,
    now = Date.now()
): void {
    player.isInvulnerable = true;
    player.invulnerableUntil = now + durationMs;
}

export function isPlayerInvulnerable(
    player: PlayerSnapshot,
    now = Date.now()): boolean {
    return (player.isInvulnerable &&
        now < player.invulnerableUntil);
}

export function updateInvulnerabilityDurations(
    players: Map<string, PlayerSnapshot>,
    now = Date.now()
): void {
    for (const player of players.values()) {
        if (
            player.isInvulnerable &&
            now >= player.invulnerableUntil
        ) {
            player.isInvulnerable = false;
            player.invulnerableUntil = 0;
        }
    }
}