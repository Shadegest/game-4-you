const pressedKeys = new Set<string>()

window.addEventListener('keydown', (event) => {
    pressedKeys.add(event.code)
})

window.addEventListener('keyup', (event) => {
    pressedKeys.delete(event.code)
})