export function removeLastListener (target, eventName) {
    const listener = target.listeners(eventName).reverse()[0]
    if (listener) {
        target.removeListener(eventName, listener)
    }
}
