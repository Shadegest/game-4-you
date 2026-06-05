import { playerInputs, updatePlayerPosition } from "../gameplay/movement.js";
import { processPlayerAttack, pruneExpiredAttacks } from "../gameplay/shooting.js";
import type { AttackSnapshot } from "../../shared/types/attack.js";
import type { PlayerSnapshot } from "../../shared/types/player.js";
import { processHitDetection, isPlayerInvulnerable, updateInvulnerabilityDurations } from "../../server/gameplay/collision.js";
import type { GameMode } from "../../shared/types/game-state.js";

export function simulateMovementTick( //simulates a movement tick by updating the position of each player based on their current input
    players: Map<string, PlayerSnapshot>,
): void {

    for (const player of players.values()) {
        const input = playerInputs.get(player.id);

        if (!input) {
            continue;
        }

        updatePlayerPosition(player, input);
    }
}

export function simulateCombatTick(
    players: Map<string, PlayerSnapshot>,
    attacks: Map<string, AttackSnapshot>,
    startedAt: number,
    gameMode: GameMode
): void {
    const now = Date.now();

    updateInvulnerabilityDurations(players, now);

    for (const player of players.values()) {
        const input = playerInputs.get(player.id);
        if (!input) {
            continue;
        }

        if (isPlayerInvulnerable(player, now)) {
            continue;
        }

        processPlayerAttack(player, input, attacks, now, startedAt, gameMode);
    }

    // 2. Prune expired attacks
    pruneExpiredAttacks(attacks, now);

    // 3. Process hit detection and apply damage
    processHitDetection(attacks, players);
}