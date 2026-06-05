import "./style.css";
import { WebsocketClient } from "./network/websocket-client";
import { ConnectionClient } from "./network/connection-client";
import { PacketHandler } from "./network/packet-handler";
import { LobbyUI } from "./ui/lobby";
import { setupKeyboardControls } from "./game/input/control";
import { audioManager } from "./audio/audio-manager";
import { handleGameStopped } from "./game/game-client";

const ws = new WebsocketClient();
const connection = new ConnectionClient(ws);
const lobby = new LobbyUI();
const packetHandler = new PacketHandler(lobby);

const WS_URL =
  import.meta.env.VITE_WS_URL ||
  "wss://education-labeled-continued-associations.trycloudflare.com";

ws.connect(WS_URL);

ws.onMessage((message) => {
  packetHandler.handle(message);
});

setInterval(() => {
  ws.send({ type: "ping", clientTime: Date.now() });
}, 10000);

setupKeyboardControls((input) => {
  connection.sendPlayerInput(input);
});

audioManager.loadAudioAssets();

const app = document.getElementById("app") || document.body;
lobby.mount(app);

lobby.onJoin((name) => {
  connection.join(name);
});

lobby.onStart(() => {
  connection.startGame();
});

lobby.onModeChange((mode) => {
  if (packetHandler.isHost()) {
    connection.setGameMode(mode);
  }
});

lobby.onDisconnect(() => {
  connection.quit();

  lobby.showJoin();
});

window.addEventListener("game-menu-action", (event) => {
  const action = (event as CustomEvent<{ action: "pause" | "resume" | "quit" }>).detail.action;

  if (action === "pause") {
    connection.pause();
    return;
  }

  if (action === "resume") {
    connection.resume();
    return;
  }

  connection.leaveGame();
  handleGameStopped();
  lobby.root.style.display = "";
  lobby.showLobby();
});
