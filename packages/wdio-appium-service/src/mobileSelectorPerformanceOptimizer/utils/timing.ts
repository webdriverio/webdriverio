/**
 * Gets high-resolution time in milliseconds.
 * Uses performance.now(), which is available on every supported Node.js version,
 * and provides microsecond precision.
 */
export function getHighResTime(): number {
    return performance.now()
}
