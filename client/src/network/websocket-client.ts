export class WebsocketClient {
    private socket: WebSocket | null = null;

    connect(url: string): void {
        this.socket = new WebSocket(url); //connects to the server ws

        this.socket.addEventListener("open", () => {
            console.log("CONNECTED");
        });

        this.socket.addEventListener("close", () => {
            console.log("DISCONNECTED");
        });
    }

    disconnect(): void {
        this.socket?.close();
    }

    send(data: unknown): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data)); //ws.on("message") will receive this data on the server
        }
    }

    onMessage(callback: (message: any) => void): void {
        this.socket?.addEventListener("message", (event) => { //ws.on("close") will receive this event on the server when the connection is closed
            callback(JSON.parse(event.data));
        });
    }
}