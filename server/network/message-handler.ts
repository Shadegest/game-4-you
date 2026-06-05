import { ClientSession } from './client-session.js';
import { ClientMessage } from '../../shared/protocol/client-messages.js';
export type MessageHandlerCallback = (session: ClientSession, message: ClientMessage) => void;
export class MessageHandler {
    private handlers: Map<ClientMessage['type'], MessageHandlerCallback[]> = new Map();
    public on(type: ClientMessage['type'], callback: MessageHandlerCallback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type)!.push(callback);
    }
    public handleMessage(session: ClientSession, message: ClientMessage) {
        const callbacks = this.handlers.get(message.type);
        if (callbacks) {
            for (const callback of callbacks) {
                try {
                    callback(session, message);
                } catch (err) {
                    console.error(`Error handling message ${message.type}:`, err);
                }
            }
        } else {
            console.warn(`No handler for message type: ${message.type}`);
        }
    }
}