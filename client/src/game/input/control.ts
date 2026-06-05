import type { PlayerInput } from "../../../../shared/types/input"
import { rhythmManager } from "../../audio/rhythm-manager"

export function setupKeyboardControls(
    sendPlayerInput: (input: PlayerInput) => void
) {
    const pressedKeys = new Set<string>()
    let attackPressedAt: number | null = null
    let spacePressed = false
    let lastSentInput: PlayerInput | null = null

    window.addEventListener('keydown', (event: Event) => {
        const keyboardEvent = event as KeyboardEvent
        if (keyboardEvent.code === 'Space' && !spacePressed) {
            spacePressed = true
            attackPressedAt = Date.now()
            window.dispatchEvent(new Event('local-attack-attempt'))
        }
        pressedKeys.add(keyboardEvent.code)
    })

    window.addEventListener('keyup', (event: Event) => {
         const keyboardEvent = event as KeyboardEvent
        if (keyboardEvent.code === 'Space') {
            spacePressed = false
            attackPressedAt = null
        }
        pressedKeys.delete(keyboardEvent.code)
    })

    window.addEventListener('blur', () => {
        pressedKeys.clear()
        spacePressed = false
        attackPressedAt = null
    })

    function updateInput() {
        const isAttacking = pressedKeys.has('Space')
        const input: PlayerInput = {
            up: pressedKeys.has('KeyW') || pressedKeys.has('ArrowUp'),
            down: pressedKeys.has('KeyS') || pressedKeys.has('ArrowDown'),
            left: pressedKeys.has('KeyA') || pressedKeys.has('ArrowLeft'),
            right: pressedKeys.has('KeyD') || pressedKeys.has('ArrowRight'),
            attack: isAttacking,
            timestamp: isAttacking ? ((attackPressedAt ?? Date.now()) + rhythmManager.getClockOffset()) : undefined
        }

        if (hasInputChanged(input, lastSentInput)) {
            sendPlayerInput(input)
            lastSentInput = input
        }

        requestAnimationFrame(updateInput)
    }
    updateInput()
}

function hasInputChanged(
    current: PlayerInput,
    previous: PlayerInput | null,
): boolean {
    return (
        !previous ||
        current.up !== previous.up ||
        current.down !== previous.down ||
        current.left !== previous.left ||
        current.right !== previous.right ||
        current.attack !== previous.attack
    )
}
