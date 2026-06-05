import { LobbyUI } from "../ui/lobby";
import { audioManager } from "../audio/audio-manager";
import { rhythmManager } from "../audio/rhythm-manager";
import { handleGameStarted, handleGameStateUpdate, handleGameStopped, showGameStatus } from "../game/game-client";

export class PacketHandler {
    private localPlayerId: string | null = null;
    private isCurrentlyHost = false;
    private lobby: LobbyUI;

    constructor(lobby: LobbyUI) {
        this.lobby = lobby;
    }

    handle(message: any): void {
        switch (message.type) {
            case "init":
                this.localPlayerId = message.playerId;
                this.lobby.showLobby();
                break;

            case "lobby_state":
                this.isCurrentlyHost =
                    message.players.find(
                        (p: any) => p.id === this.localPlayerId
                    )?.isHost ?? false;

                this.lobby.updateLobbyState(
                    message.players,
                    this.isCurrentlyHost,
                    message.gameMode
                );

                this.lobby.setCanStart(
                    message.canStart && this.isCurrentlyHost
                );
                break;

            case "error":
                alert(message.message);
                break;

            case "game_started":
                this.lobby.root.style.display = "none";
                if (message.initialState.gameMode !== "beat") {
                    audioManager.playMusic();
                }
                handleGameStarted(message.initialState);
                break;

            case "pong":
                rhythmManager.handlePong(
                    message.clientTime,
                    message.serverTime
                );
                break;

            case "state_update":
                handleGameStateUpdate(
                    message.players,
                    message.attacks,
                    message.timer,
                    message.beatState
                );
                break;

            case "game_paused":
                showGameStatus(`${message.byPlayerName} paused the game`);
                break;

            case "game_resumed":
                showGameStatus(`${message.byPlayerName} resumed the game`);
                break;

            case "game_aborted":
                handleGameStopped();
                this.lobby.root.style.display = "";
                this.lobby.showLobby();
                alert("Game was aborted because a player left.");
                break;

            case "player_left":
                showGameStatus(`${message.playerName ?? "A player"} quit the game`);
                break;
        }
    }

    isHost(): boolean {
        return this.isCurrentlyHost;
    }
}
