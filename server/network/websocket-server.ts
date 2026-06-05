import { WebSocketServer as WSS, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { ClientSession } from './client-session.js';
import { MessageHandler } from './message-handler.js';
import type { ServerMessage } from '../../shared/protocol/server-messages.js';
export class WebsocketServer {
    private wss: WSS | null = null;
    public sessions: Map<string, ClientSession> = new Map();
    public messageHandler: MessageHandler = new MessageHandler();
    private nextSessionId: number = 1;
    public start(port: number): void {
        this.wss = new WSS({ port });
        this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => { // Handle new client connection
            const sessionId = `session_${this.nextSessionId++}`;
            const session = new ClientSession(
                sessionId,
                ws,
                this.handleMessage.bind(this),
                this.handleClose.bind(this)
            );

            this.sessions.set(sessionId, session);
            console.log(`New connection: ${sessionId}`);
        });
        console.log(`WebSocket server initialized on port ${port}`);
    }
    private handleMessage(session: ClientSession, message: any): void {
        this.messageHandler.handleMessage(session, message);
    }
    private handleClose(session: ClientSession): void {
        this.sessions.delete(session.id);
        console.log(`Connection closed: ${session.id}`);
        // Send a quit message so game logic knows they disconnected if they were a player.
        try {
            this.messageHandler.handleMessage(session, { type: 'quit' });
        } catch (err) {
            console.error('Error handling player disconnect', err);
        }
    }
    public broadcast(message: ServerMessage): void {
        for (const session of this.sessions.values()) {
            session.send(message);
        }
    }
}
