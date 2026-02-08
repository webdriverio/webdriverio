/**
 * Gets high-resolution time in milliseconds.
 * Uses performance.now() which is available in Node.js v18+ (WebdriverIO's minimum requirement)
 * and provides microsecond precision.
 */
export function getHighResTime(): number {
    return performance.now()
}
