import type { PlayerInput } from '../../../shared/types/input';
import { WebsocketClient } from './websocket-client';

export class ConnectionClient {
    private ws: WebsocketClient;

    constructor(ws: WebsocketClient) {
        this.ws = ws;
    }

    join(name: string): void {
        this.ws.send({
            type: "join",
            name
        });
    }

    startGame(): void {
        this.ws.send({
            type: "start_game"
        });
    }

    setGameMode(gameMode: 'normal' | 'beat'): void {
        this.ws.send({
            type: "set_game_mode",
            gameMode
        });
    }

    pause(): void {
        this.ws.send({
            type: "pause"
        });
    }

    resume(): void {
        this.ws.send({
            type: "resume"
        });
    }

    leaveGame(): void {
        this.ws.send({
            type: "leave_game"
        });
    }

    quit(): void {
        this.ws.send({
            type: "quit"
        });
    }

    sendPlayerInput(input: PlayerInput): void {
        this.ws.send({
            type: "player_input",
            input
        });
    }
}
