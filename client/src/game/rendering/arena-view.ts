import { GAME_CONFIG } from "../../../../shared/constants/game";

export class ArenaView {
    public readonly element: HTMLDivElement;

    constructor() {
        this.element = document.createElement("div");
        this.element.className = "arena";
        this.element.style.width = `${GAME_CONFIG.gridWidth * GAME_CONFIG.tileSize}px`;
        this.element.style.height = `${GAME_CONFIG.gridHeight * GAME_CONFIG.tileSize}px`;
        this.renderGrid();
    }

    private renderGrid(): void {
        const cellCount = GAME_CONFIG.gridWidth * GAME_CONFIG.gridHeight;

        for (let index = 0; index < cellCount; index += 1) {
            const cell = document.createElement("div");
            cell.className = "arena-cell";
            this.element.appendChild(cell);
        }
    }
}
