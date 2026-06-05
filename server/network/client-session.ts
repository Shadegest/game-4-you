import { WebSocket } from 'ws';
import type { ClientMessage } from '../../shared/protocol/client-messages.js';
import type { ServerMessage } from '../../shared/protocol/server-messages.js';
export class ClientSession {
    public playerId: string | null = null;
    public playerName: string | null = null;
    private disconnected = false;
    constructor(
        public readonly id: string,
        private readonly ws: WebSocket,
        private readonly onMessage: (session: ClientSession, message: ClientMessage) => void,
        private readonly onClose: (session: ClientSession) => void
    ) {
        this.ws.on('message', (data: any) => {
            try {
                const message = JSON.parse(data.toString()) as ClientMessage;
                this.onMessage(this, message);
            } catch (err) {
                console.error(`Invalid message from client ${this.id}:`, err);
            }
        });
        this.ws.on('close', () => {
            this.handleDisconnect();
        });
        this.ws.on('error', (err) => {
            console.error(`WebSocket error for client ${this.id}:`, err);
            this.handleDisconnect();
        });
    }

    private handleDisconnect(): void { // Ensure we only handle disconnect once
        if (this.disconnected) {
            return
        }
        this.disconnected = true;
        this.onClose(this);
    }

    public send(message: ServerMessage): void {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
    public disconnect(): void {
        this.ws.close();
    }
}