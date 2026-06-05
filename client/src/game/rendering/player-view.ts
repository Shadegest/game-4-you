import type { PlayerSnapshot } from "../../../../shared/types/player";
import { audioManager } from "../../audio/audio-manager";

export class PlayerView {
    public readonly element: HTMLDivElement;

    private lastX = 0
    private lastY = 0
    private lastStepTime = 0
    private wasInvulnerable = false

    constructor(player: PlayerSnapshot) {
        this.element = document.createElement("div");
        this.element.className = "player-entity";
        this.element.title = player.name;
        this.update(player);
    }

    update(player: PlayerSnapshot): void {
        this.element.dataset.playerId = player.id;
        this.element.dataset.playerName = player.name;
        this.element.textContent = player.name.slice(0, 2).toUpperCase();
        this.element.style.transform = `translate(${player.position.x}px, ${player.position.y}px)`;

        if (player.isInvulnerable) {
            this.element.style.opacity = "0.5";
            this.element.style.filter = "grayscale(100%) brightness(1.5)";
        } else {
            this.element.style.opacity = "1";
            this.element.style.filter = "none";
        }

        if (
            player.isInvulnerable &&
            !this.wasInvulnerable
        ) {
            audioManager.play("hit");
        }

        const moved =
            player.position.x !== this.lastX ||
            player.position.y !== this.lastY

        const now = performance.now()

        if (moved && now - this.lastStepTime > 180) {
            audioManager.play("footstep")
            this.lastStepTime = now
        }

        this.wasInvulnerable = player.isInvulnerable;
        this.lastX = player.position.x
        this.lastY = player.position.y
    }
}
