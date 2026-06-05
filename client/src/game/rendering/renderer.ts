import type { AttackSnapshot } from "../../../../shared/types/attack";
import type { PlayerSnapshot } from "../../../../shared/types/player";
import { ArenaView } from "./arena-view";
import { AttackView } from "./attack-view";
import { PlayerView } from "./player-view";
import { audioManager } from "../../audio/audio-manager";

export class Renderer {
    public readonly root: HTMLDivElement;
    private readonly arenaView: ArenaView;
    private readonly attackViews = new Map<string, AttackView>();
    private readonly playerViews = new Map<string, PlayerView>();
    private readonly timerElement: HTMLDivElement;
    private readonly fpsElement: HTMLDivElement;
    private latestPlayers: PlayerSnapshot[] = [];
    private readonly winnerElement: HTMLDivElement;
    private readonly finalScoresElement: HTMLDivElement;
    private readonly scoreboardElement: HTMLDivElement;
    private readonly menuElement: HTMLDivElement;
    private readonly statusElement: HTMLDivElement;

    private rhythmGuide: HTMLDivElement;
    private leftIndicator: HTMLDivElement;
    private rightIndicator: HTMLDivElement;
    private feedbackElement: HTMLDivElement;
    private feedbackTimeoutId: any = null;

    constructor() {
        this.root = document.createElement("div");
        this.root.className = "game-screen";

        this.timerElement = document.createElement("div");
        this.timerElement.className = "game-timer";

        this.fpsElement = document.createElement("div");
        this.fpsElement.className = "fps-counter";
        this.fpsElement.textContent = "FPS 0";

        this.arenaView = new ArenaView();

        this.winnerElement = document.createElement("div");
        this.winnerElement.className = "winner-announcement-simple";

        this.finalScoresElement = document.createElement("div");
        this.finalScoresElement.className = "final-scores";

        this.scoreboardElement = document.createElement("div");
        this.scoreboardElement.className = "scoreboard";

        this.menuElement = document.createElement("div");
        this.menuElement.className = "game-menu";

        const pauseButton = this.createMenuButton("Pause", "pause");
        const resumeButton = this.createMenuButton("Resume", "resume");
        const quitButton = this.createMenuButton("Quit", "quit");

        this.menuElement.append(pauseButton, resumeButton, quitButton);

        this.statusElement = document.createElement("div");
        this.statusElement.className = "game-status-message";

        this.rhythmGuide = document.createElement("div");
        this.rhythmGuide.className = "rhythm-guide";
        this.rhythmGuide.style.display = "none"; // hidden by default

        const track = document.createElement("div");
        track.className = "rhythm-track";

        const target = document.createElement("div");
        target.className = "rhythm-target";

        this.leftIndicator = document.createElement("div");
        this.leftIndicator.className = "rhythm-indicator left";

        this.rightIndicator = document.createElement("div");
        this.rightIndicator.className = "rhythm-indicator right";

        track.append(target, this.leftIndicator, this.rightIndicator);
        this.rhythmGuide.append(track);

        this.feedbackElement = document.createElement("div");
        this.feedbackElement.className = "rhythm-feedback";

        this.root.append(this.fpsElement, this.timerElement, this.menuElement, this.statusElement, this.rhythmGuide, this.feedbackElement, this.arenaView.element, this.finalScoresElement, this.winnerElement, this.scoreboardElement);

        //Music toggle 
        const musicButton = document.createElement("button");

        musicButton.className = 'music-button'
        musicButton.textContent = 'Music ON/OFF'

        musicButton.onclick = () => {
            audioManager.toggleMusic();
            musicButton.blur() // Remove focus from the button after click to prevent accidental multiple toggles
        }

        this.root.append(musicButton);

    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.root);
    }

    showStatus(message: string): void {
        this.statusElement.textContent = message;
        this.statusElement.classList.add("visible");
    }

    renderPlayers(players: PlayerSnapshot[]): void {
        this.latestPlayers = players;
        const activePlayerIds = new Set(players.map((player) => player.id));

        for (const player of players) {
            let playerView = this.playerViews.get(player.id);

            if (!playerView) {
                playerView = new PlayerView(player);
                this.playerViews.set(player.id, playerView);
                this.arenaView.element.appendChild(playerView.element);
            }

            playerView.update(player);
        }

        for (const [playerId, playerView] of this.playerViews) {
            if (!activePlayerIds.has(playerId)) {
                playerView.element.remove();
                this.playerViews.delete(playerId);
            }
        }
    }

    renderAttacks(attacks: AttackSnapshot[]): void {
        const activeAttackIds = new Set(attacks.map((attack) => attack.id));

        for (const attack of attacks) {
            let attackView = this.attackViews.get(attack.id);

            if (!attackView) {
                attackView = new AttackView(attack);
                audioManager.play("lightning");
                this.attackViews.set(attack.id, attackView);
                this.arenaView.element.appendChild(attackView.element);
            }

            attackView.update(attack);
        }

        for (const [attackId, attackView] of this.attackViews) {
            if (!activeAttackIds.has(attackId)) {
                attackView.element.remove();
                this.attackViews.delete(attackId);
            }
        }
    }

    renderTimer(remainingMs: number): void {
        const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        this.timerElement.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;

        if (seconds <= 0 && this.latestPlayers.length > 0) {
            const highestScore = Math.max(...this.latestPlayers.map(p => p.score));
            const winners = this.latestPlayers.filter(p => p.score === highestScore);

            if (winners.length === 1) {
                const w = winners[0];
                const originalIdx = this.latestPlayers.findIndex(p => p.id === w.id);
                this.winnerElement.innerHTML = `WINNER: <span class="winner-name-inline" data-player-index="${originalIdx}">${w.name}</span> (${w.score} pts)`;
            } else if (winners.length > 1) {
                const winnerSpans = winners.map(w => {
                    const originalIdx = this.latestPlayers.findIndex(p => p.id === w.id);
                    return `<span class="winner-name-inline" data-player-index="${originalIdx}">${w.name}</span>`;
                }).join(" & ");
                this.winnerElement.innerHTML = `TIE: ${winnerSpans} (${winners[0].score} pts)`;
            } else {
                this.winnerElement.textContent = "NO WINNER";
            }
            this.winnerElement.style.display = "block";
        } else {
            this.winnerElement.style.display = "none";
            this.winnerElement.innerHTML = "";
        }
    }

    renderWindowScreen(players: PlayerSnapshot[]): void {
        const sortedPlayers = [...players]
            .sort((a, b) => b.score - a.score)

        const highestScore = sortedPlayers[0]?.score ?? 0;

        const winners = sortedPlayers.filter(
            player => player.score === highestScore
        )

        if (winners.length === 1) {
            this.winnerElement.textContent =
                `WINNER: ${winners[0].name}`
        } else {
            this.winnerElement.textContent =
                `TIE`
        }

        this.finalScoresElement.innerHTML =
            sortedPlayers
                .map(
                    (player, index) =>
                        `${index + 1}. ${player.name} - ${player.score}`
                )
                .join("<br>")

        this.winnerElement.style.display = "block"
        this.finalScoresElement.style.display = "block"
    }

    renderScoreboard(players: PlayerSnapshot[]): void {
        const sortedPlayers = [...players]
            .sort((a, b) => b.score - a.score)

        this.scoreboardElement.innerHTML = `
        <h3>Scoreboard</h3>

        ${sortedPlayers
                .map((player, index) => `
                <div class="scoreboard-row">
                    <span>#${index + 1} ${player.name}</span>
                    <span>${player.score}</span>
                </div>
            `)
                .join("")}
    `
    }

    renderFps(fps: number): void {
        this.fpsElement.textContent = `FPS ${fps}`;
    }

    showRhythmGuide(show: boolean): void {
        this.rhythmGuide.style.display = show ? "block" : "none";
    }

    renderRhythmGuide(progress: number, isPerfect: boolean, isGood: boolean): void {
        // Left slider moves from 0% to 50%
        const leftPercent = progress * 50;
        this.leftIndicator.style.left = `${leftPercent}%`;

        // Right slider moves from 100% to 50%
        const rightPercent = 100 - (progress * 50);
        this.rightIndicator.style.left = `${rightPercent}%`;

        // Adjust target zone glow based on window state
        const target = this.rhythmGuide.querySelector(".rhythm-target") as HTMLDivElement;
        if (target) {
            if (isPerfect) {
                target.style.background = "rgba(0, 229, 255, 0.4)";
                target.style.boxShadow = "0 0 10px #00e5ff, 0 0 20px #00e5ff";
            } else if (isGood) {
                target.style.background = "rgba(255, 0, 127, 0.3)";
                target.style.boxShadow = "0 0 8px #ff007f";
            } else {
                target.style.background = "rgba(255, 255, 255, 0.15)";
                target.style.boxShadow = "none";
            }
        }
    }

    showHitFeedback(rating: 'perfect' | 'good' | 'miss'): void {
        this.feedbackElement.className = "rhythm-feedback";
        if (this.feedbackTimeoutId) {
            clearTimeout(this.feedbackTimeoutId);
        }

        // Force repaint reflow
        void this.feedbackElement.offsetWidth;

        this.feedbackElement.classList.add(rating);
        this.feedbackElement.textContent = rating;

        this.feedbackTimeoutId = setTimeout(() => {
            this.feedbackElement.className = "rhythm-feedback";
        }, 500);
    }

    private createMenuButton(label: string, action: "pause" | "resume" | "quit"): HTMLButtonElement {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.addEventListener("click", () => {
            button.blur();
            window.dispatchEvent(new CustomEvent("game-menu-action", {
                detail: { action }
            }));
        });
        return button;
    }
}
