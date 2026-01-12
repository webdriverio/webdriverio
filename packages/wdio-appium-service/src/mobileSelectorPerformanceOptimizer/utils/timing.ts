/**
 * Gets high-resolution time in milliseconds.
 */
export function getHighResTime(): number {
    if (typeof process !== 'undefined' && process.hrtime) {
        const [seconds, nanoseconds] = process.hrtime()
        return seconds * 1000 + nanoseconds / 1000000
    }
    return Date.now()
}
