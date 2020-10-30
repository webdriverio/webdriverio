import type { Transform } from 'stream'

export function removeLastListener (target: Transform, eventName: string): void {
    const listener = target.listeners(eventName).reverse()[0] as () => void
    if (listener) {
        target.removeListener(eventName, listener)
    }
}
