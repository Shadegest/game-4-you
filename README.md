# Rhythm Arena

Rhythm Arena is a real-time multiplayer browser game built with TypeScript and WebSockets. Players compete in a fast-paced arena where movement, positioning, timing, and rhythm determine the winner.

The game supports both multiplayer matches and a single-player mode with AI-controlled opponents of varying difficulty levels.

---

## Game Modes

### Normal Mode

Classic arena combat without rhythm restrictions. Players can move and attack freely while competing for the highest score before the timer expires.

### Beat Mode

A rhythm-based mode where players are rewarded for performing actions in sync with the music beat. Precision and timing become just as important as combat skills.

### Multiplayer Mode

Play against other human players through a WebSocket-based real-time multiplayer system.

---

## Objective

Score more points than your opponents before the match timer reaches zero.

Players gain points by:

* Successfully hitting opponents
* Eliminating opponents
* Maintaining strong performance throughout the match

The player with the highest score at the end of the round wins.

---

## Controls

| Action         | Key   |
| -------------- | ----- |
| Move Up        | W     |
| Move Down      | S     |
| Move Left      | A     |
| Move Right     | D     |
| Attack         | Space |
| Pause / Resume | Esc   |

Players can move diagonally by combining movement keys.

---

## Features

* Real-time multiplayer gameplay
* Authoritative server simulation
* Rhythm-based gameplay mode
* Match timer and winner screen
* Scoreboard and live score updates
* Pause and resume functionality
* Sound effects and background music
* WebSocket networking
* Shared TypeScript types between client and server

---

## Technologies

### Frontend

* TypeScript
* Vite
* HTML5
* SVG Rendering
* Web Audio API

### Backend

* Node.js
* TypeScript
* WebSocket (`ws`)

### Shared

* Shared TypeScript domain models
* Shared game state definitions
* Shared message contracts

---

## Project Structure

client/

* Rendering
* UI
* Input handling
* Audio system
* Networking

server/

* Game simulation
* Lobby management
* Combat logic
* Score calculation
* WebSocket server

shared/

* Types
* Constants
* Network message definitions

---

## Running the Project

### Client

```bash
cd client
pnpm install
pnpm dev
```

### Server

```bash
cd server
pnpm install
pnpm dlx tsx index.ts
```

---

## Authors
Developed as a collaborative TypeScript web-game project focusing on real-time networking, gameplay systems, and browser game development.
Mykyta Burachenko, Mattia Spiga, Aku Antti August Makkonen



