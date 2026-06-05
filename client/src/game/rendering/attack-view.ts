import { GAME_CONFIG } from "../../../../shared/constants/game";
import type { AttackSnapshot } from "../../../../shared/types/attack";

export class AttackView {
    public readonly element: HTMLDivElement;

    constructor(attack: AttackSnapshot) {
        this.element = document.createElement("div");
        this.element.className = "attack-entity";
        this.update(attack);
    }

    update(attack: AttackSnapshot): void {
        const { x, y } = attack.origin;
        const tileSize = GAME_CONFIG.tileSize;
        const gridWidthPx = GAME_CONFIG.gridWidth * GAME_CONFIG.tileSize;
        const gridHeightPx = GAME_CONFIG.gridHeight * GAME_CONFIG.tileSize;

        this.element.dataset.attackId = attack.id;
        this.element.dataset.direction = attack.direction;

        if (attack.direction === "left") {
            const visualRange = Math.min(attack.range, x);
            this.element.style.width = `${visualRange}px`;
            this.element.style.height = `${tileSize}px`;
            this.element.style.transform = `translate(${x - visualRange}px, ${y}px)`;
        } else if (attack.direction === "right") {
            const visualRange = Math.min(attack.range, gridWidthPx - x - tileSize);
            this.element.style.width = `${visualRange}px`;
            this.element.style.height = `${tileSize}px`;
            this.element.style.transform = `translate(${x + tileSize}px, ${y}px)`;
        } else if (attack.direction === "up") {
            const visualRange = Math.min(attack.range, y);
            this.element.style.width = `${tileSize}px`;
            this.element.style.height = `${visualRange}px`;
            this.element.style.transform = `translate(${x}px, ${y - visualRange}px)`;
        } else if (attack.direction === "down") {
            const visualRange = Math.min(attack.range, gridHeightPx - y - tileSize);
            this.element.style.width = `${tileSize}px`;
            this.element.style.height = `${visualRange}px`;
            this.element.style.transform = `translate(${x}px, ${y + tileSize}px)`;
        }
    }
}
