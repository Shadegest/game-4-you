import type { SerializedGameState, GameMode } from "../../../shared/types/game-state";
import type { AttackSnapshot } from "../../../shared/types/attack";
import type { PlayerSnapshot } from "../../../shared/types/player";
import { Renderer } from "./rendering/renderer";
import { startRenderLoop, type RenderLoopController } from "./rendering/animation";
import { rhythmManager } from "../audio/rhythm-manager";
// import { audioManager } from "../audio/audio-manager";

class GameClient {
    private renderer: Renderer | null = null;
    private renderLoop: RenderLoopController | null = null;
    private latestAttacks: AttackSnapshot[] = [];
    private latestPlayers: PlayerSnapshot[] = [];
    private latestTimer = 0;
    private gameMode: GameMode = 'normal';
    private lastBeatIndex = -1;

    constructor() {
        window.addEventListener('local-attack-attempt', () => {
            if (this.gameMode === 'beat') {
                const validation = rhythmManager.validateCurrentTiming();
                this.renderer?.showHitFeedback(validation.rating);
            }
        });
    }

    getGameMode(): GameMode {
        return this.gameMode;
    }

    stop(): void {
        this.renderLoop?.stop();
        this.renderLoop = null;
        rhythmManager.stop();
        this.renderer?.root.remove();
        this.renderer = null;
        this.latestAttacks = [];
        this.latestPlayers = [];
        this.latestTimer = 0;
    }

    start(initialState: SerializedGameState): void {
        this.renderLoop?.stop();
        rhythmManager.stop();
        this.renderer?.root.remove();

        const app = document.getElementById('app') || document.body;
        this.renderer = new Renderer();
        this.renderer.mount(app);

        this.gameMode = initialState.gameMode;
        this.latestAttacks = initialState.attacks;
        this.latestPlayers = initialState.players;
        this.latestTimer = initialState.remainingMs;
        this.lastBeatIndex = -1;

        rhythmManager.start(initialState.startedAt);
        this.renderer.showRhythmGuide(this.gameMode === 'beat');

        this.renderLoop = startRenderLoop(
            () => this.renderFrame(),
            (fps) => this.renderer?.renderFps(fps)
        );
    }

    update(
        players: PlayerSnapshot[],
        attacks: AttackSnapshot[],
        timer: number,
        beatState?: { beatIndex: number; beatProgress: number; serverTime: number }
    ): void {
        if (!this.renderLoop) {
            return;
        }

        this.latestAttacks = attacks;
        this.latestPlayers = players;
        this.latestTimer = timer;

        if (beatState) {
            rhythmManager.updateBeatSnapshot(beatState.beatIndex, beatState.beatProgress, beatState.serverTime);
        }
    }

    private renderFrame(): void {
        if (!this.renderer) {
            return;
        }

        this.renderer.renderAttacks(this.latestAttacks);
        this.renderer.renderPlayers(this.latestPlayers);
        this.renderer.renderTimer(this.latestTimer);
        this.renderer.renderScoreboard(this.latestPlayers);

        if (this.gameMode === 'beat') {
            const timing = rhythmManager.getCurrentBeatTiming();
            if (timing) {
                // Play metronome sound click on every beat
                if (timing.beatIndex !== this.lastBeatIndex) {
                    this.lastBeatIndex = timing.beatIndex;
                }
                this.renderer.renderRhythmGuide(
                    timing.beatProgress,
                    timing.isPerfectWindow,
                    timing.isGoodWindow
                );
            }
        }
    }

    showStatus(message: string): void {
        this.renderer?.showStatus(message);
    }
}

const gameClient = new GameClient();

export function handleGameStarted(initialState: SerializedGameState): void {
    gameClient.start(initialState);
}

export function handleGameStopped(): void {
    gameClient.stop();
}

export function showGameStatus(message: string): void {
    gameClient.showStatus(message);
}

export function handleGameStateUpdate(
    players: PlayerSnapshot[],
    attacks: AttackSnapshot[],
    timer: number,
    beatState?: { beatIndex: number; beatProgress: number; serverTime: number }
): void {
    gameClient.update(players, attacks, timer, beatState);
}
