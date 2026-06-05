export class LobbyUI {
    public readonly root: HTMLDivElement;

    private joinScreen: HTMLDivElement;
    private lobbyScreen: HTMLDivElement;

    private nameInput: HTMLInputElement;
    private joinButton: HTMLButtonElement;
    private disconnectButton: HTMLButtonElement;

    private playerList: HTMLUListElement;

    private startButton: HTMLButtonElement;
    private modeContainer: HTMLDivElement;
    private modeSelect: HTMLSelectElement;

    constructor() {
        this.root = document.createElement("div");
        this.root.id = "lobby";

        // JOIN SCREEN

        this.joinScreen = document.createElement("div");

        this.nameInput = document.createElement("input");

        this.joinButton = document.createElement("button");
        this.joinButton.textContent = "Join";

        this.joinScreen.append(
            this.nameInput,
            this.joinButton
        );

        // LOBBY SCREEN

        this.lobbyScreen = document.createElement("div");

        // VERY IMPORTANT
        this.lobbyScreen.hidden = true;

        this.playerList = document.createElement("ul");

        this.modeContainer = document.createElement("div");
        this.modeContainer.className = "mode-selection";
        this.modeContainer.style.margin = "15px 0";

        const label = document.createElement("label");
        label.textContent = "Game Mode: ";
        label.style.marginRight = "10px";
        label.style.fontWeight = "bold";

        this.modeSelect = document.createElement("select");
        this.modeSelect.style.padding = "6px 12px";
        this.modeSelect.style.background = "#222";
        this.modeSelect.style.color = "white";
        this.modeSelect.style.border = "1px solid #555";
        this.modeSelect.style.borderRadius = "4px";
        this.modeSelect.style.cursor = "pointer";

        const normalOpt = document.createElement("option");
        normalOpt.value = "normal";
        normalOpt.textContent = "Normal Mode";

        const beatOpt = document.createElement("option");
        beatOpt.value = "beat";
        beatOpt.textContent = "Beat Mode";

        this.modeSelect.append(normalOpt, beatOpt);
        this.modeContainer.append(label, this.modeSelect);

        this.startButton = document.createElement("button");
        this.startButton.textContent = "Start";

        this.disconnectButton = document.createElement("button");
        this.disconnectButton.textContent = "Disconnect";

        this.lobbyScreen.append(
            this.playerList,
            this.modeContainer,
            this.startButton,
            this.disconnectButton
        );

        this.root.append(
            this.joinScreen,
            this.lobbyScreen
        );
    }

    mount(parent: HTMLElement): void {
        parent.appendChild(this.root);
    }

    onJoin(callback: (name: string) => void): void {
        this.joinButton.addEventListener("click", () => {
            callback(this.nameInput.value);
        });
    }

    onDisconnect(callback: () => void): void {
        this.disconnectButton.addEventListener("click", callback);
    }

    onStart(callback: () => void): void {
        this.startButton.addEventListener("click", callback);
    }

    showLobby(): void {
        this.joinScreen.hidden = true;
        this.lobbyScreen.hidden = false;
    }

    showJoin(): void {
        this.joinScreen.hidden = false;
        this.lobbyScreen.hidden = true;
    }

    updatePlayers(players: any[]): void {
        this.playerList.innerHTML = "";

        for (const player of players) {
            const li = document.createElement("li");

            li.textContent = player.isHost
                ? `${player.name} (Host)`
                : player.name;

            this.playerList.appendChild(li);
        }
    }

    setCanStart(canStart: boolean): void {
        this.startButton.disabled = !canStart;
    }

    onModeChange(callback: (mode: 'normal' | 'beat') => void): void {
        this.modeSelect.addEventListener("change", (event) => {
            if (event.isTrusted) {
                callback(this.modeSelect.value as 'normal' | 'beat');
            }
        });
    }

    updateLobbyState(players: any[], isHost: boolean, gameMode: 'normal' | 'beat'): void {
        this.updatePlayers(players);
        this.modeSelect.value = gameMode;
        this.modeSelect.disabled = !isHost;
    }
}
