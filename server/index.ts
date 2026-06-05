import { WebsocketServer } from './network/websocket-server.js';
import { clearAttackState } from './gameplay/shooting.js';
import { playerInputs } from './gameplay/movement.js';
import { RoomManager } from './rooms/room-manager.js';
import { GameRoom } from './rooms/game-room.js';
import { startGameLoop, type GameLoopController } from './simulation/game-loop.js';
import { broadcastGameStarted, broadcastLobbyState } from './network/broadcast.js';

const PORT = parseInt(process.env.PORT || '8080', 10);
const DEFAULT_ROOM_ID = 'main';

const server = new WebsocketServer();
const roomManager = new RoomManager();
const defaultRoom = roomManager.getOrCreateRoom(DEFAULT_ROOM_ID);
const gameRoom = new GameRoom(DEFAULT_ROOM_ID);
let gameLoop: GameLoopController | null = null;

server.messageHandler.on('join', (session, message) => {
    if (message.type !== 'join') {
        return;
    }

    const playerId = session.playerId ?? `player_${Math.random().toString(36).substring(2, 9)}`;
    const result = defaultRoom.joinPlayer(playerId, message.name);

    if (!result.ok) {
        session.send({
            type: 'error',
            message: `Could not join lobby: ${result.reason}`
        });
        return;
    }

    session.playerId = result.player.id;
    session.playerName = result.player.name;
    console.log(`Player joined: ${result.player.name} (${session.playerId})`);

    session.send({
        type: 'init',
        playerId: session.playerId,
        isLeader: result.player.isHost
    });

    server.broadcast({
        type: 'player_joined',
        player: {
            id: result.player.id,
            name: result.player.name,
            position: { x: 0, y: 0 },
            score: 0,
            facingDirection: 'down',
            isInvulnerable: false,
            invulnerableUntil: 0
        }
    });

    broadcastLobbyState(server, result.snapshot);
});

server.messageHandler.on('start_game', (session, message) => {
    if (message.type !== 'start_game') {
        return;
    }

    if (!session.playerId) {
        session.send({ type: 'error', message: 'You must join before starting the game' });
        return;
    }

    const result = defaultRoom.startGame(session.playerId);

    if (!result.ok) {
        session.send({
            type: 'error',
            message: `Could not start game: ${result.reason}`
        });
        return;
    }

    broadcastLobbyState(server, result.snapshot);
    gameRoom.createGameState(result.snapshot);

    gameLoop?.stop();
    gameLoop = startGameLoop(server, gameRoom);

    const serializedState = gameRoom.serializeState();
    if (serializedState) {
        broadcastGameStarted(server, serializedState);
    }
});

server.messageHandler.on('set_game_mode', (session, message) => {
    if (message.type !== 'set_game_mode' || !session.playerId) {
        return;
    }
    const result = defaultRoom.setGameMode(session.playerId, message.gameMode);
    if (!result.ok) {
        session.send({
            type: 'error',
            message: `Could not set game mode: ${result.reason}`
        });
        return;
    }
    broadcastLobbyState(server, result.snapshot);
});

server.messageHandler.on('player_input', (session, message) => {
    if (message.type !== 'player_input' || !session.playerId) {
        return;
    }

    const state = gameRoom.getState();

    if (!state?.players.has(session.playerId) || state.phase !== 'running') {
        return;
    }

    playerInputs.set(session.playerId, message.input);
});

server.messageHandler.on('pause', (session, message) => {
    if (message.type !== 'pause' || !session.playerId || !session.playerName) {
        return;
    }

    if (!gameRoom.getState()?.players.has(session.playerId)) {
        return;
    }

    if (!gameRoom.pause()) {
        return;
    }

    playerInputs.clear();
    server.broadcast({
        type: 'game_paused',
        byPlayerName: session.playerName
    });

    const serializedState = gameRoom.serializeState();
    if (serializedState) {
        server.broadcast({
            type: 'state_update',
            players: serializedState.players,
            attacks: serializedState.attacks,
            timer: serializedState.remainingMs,
        });
    }
});

server.messageHandler.on('resume', (session, message) => {
    if (message.type !== 'resume' || !session.playerId || !session.playerName) {
        return;
    }

    if (!gameRoom.getState()?.players.has(session.playerId)) {
        return;
    }

    if (!gameRoom.resume()) {
        return;
    }

    server.broadcast({
        type: 'game_resumed',
        byPlayerName: session.playerName
    });
});

server.messageHandler.on('leave_game', (session, message) => {
    if (message.type !== 'leave_game' || !session.playerId) {
        return;
    }

    const playerId = session.playerId;
    const playerName = session.playerName ?? 'A player';

    const state = gameRoom.getState();
    if (state && state.players.has(playerId)) {
        gameRoom.reset();
        const lobbySnapshot = defaultRoom.resetToWaiting();
        server.broadcast({ type: 'game_aborted' });
        broadcastLobbyState(server, lobbySnapshot);
    } else {
        gameRoom.getPlayers().delete(playerId);
        playerInputs.delete(playerId);
        clearAttackState(playerId);
    }

    server.broadcast({ type: 'player_left', playerId, playerName });
});

server.messageHandler.on('quit', (session, message) => {
    if (message.type !== 'quit' || !session.playerId) {
        return;
    }

    const playerId = session.playerId;
    const playerName = session.playerName ?? 'A player';
    
    const state = gameRoom.getState();
    if (state && state.players.has(playerId)) {
        gameRoom.reset();
        server.broadcast({ type: 'game_aborted' });
    }

    const snapshot = defaultRoom.removePlayer(playerId);
    gameRoom.getPlayers().delete(playerId);
    playerInputs.delete(playerId);
    clearAttackState(playerId);

    session.playerId = null;
    session.playerName = null;

    server.broadcast({ type: 'player_left', playerId, playerName });
    broadcastLobbyState(server, snapshot);
});

server.start(PORT);
