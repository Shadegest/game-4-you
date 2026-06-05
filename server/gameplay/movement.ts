import type { PlayerSnapshot } from "../../shared/types/player.js";
import type { PlayerInput } from "../../shared/types/input.js";
import type { Direction } from "../../shared/types/attack.js";
import { isPlayerInvulnerable } from "./collision.js";

export const playerInputs = new Map<string, PlayerInput>();

const TILE_SIZE = 32;

const WORLD_WIDTH = 20;
const WORLD_HEIGHT = 15;
const MOVE_DELAY = 100;

const playerMoveCooldown = new Map<string, number>();

export function updatePlayerPosition(
    player: PlayerSnapshot,
    input: PlayerInput
): void {
    let moveX = 0;
    let moveY = 0;

    const now = Date.now();

    const lastMove = playerMoveCooldown.get(player.id) ?? 0;

    if (now - lastMove < MOVE_DELAY) {
        return;
    }

    if (input.left) {
        moveX -= TILE_SIZE;
        updateFacingDirection(player, 'left');
    }
    if (input.right) {
        moveX += TILE_SIZE;
        updateFacingDirection(player, 'right');
    }
    if (input.up) {
        moveY -= TILE_SIZE;
        updateFacingDirection(player, 'up');
    }
    if (input.down) {
        moveY += TILE_SIZE;
        updateFacingDirection(player, 'down');
    }

    player.position.x += moveX;
    player.position.y += moveY;

    playerMoveCooldown.set(player.id, now);

    validateWorldBounds(player);
}

function updateFacingDirection(player: PlayerSnapshot, direction: Direction): void {
    player.facingDirection = direction;
}

function validateWorldBounds(player: PlayerSnapshot): void {
    const MAX_X = (WORLD_WIDTH - 1) * TILE_SIZE;
    const MAX_Y = (WORLD_HEIGHT - 1) * TILE_SIZE;

    if (player.position.x < 0) {
        player.position.x = 0;
    }

    if (player.position.y < 0) {
        player.position.y = 0;
    }

    if (player.position.x > MAX_X) {
        player.position.x = MAX_X;
    }

    if (player.position.y > MAX_Y) {
        player.position.y = MAX_Y;
    }
}