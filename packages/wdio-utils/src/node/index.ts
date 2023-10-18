import fs from 'node:fs'

export { startWebDriver } from './driver/index.js'
export { setupDriver, setupBrowser } from './driver/manager.js'

/**
 * Helper utility to check file access
 * @param {string} file file to check access for
 * @return              true if file can be accessed
 */
export const canAccess = (file?: string) => {
    if (!file) {
        return false
    }

    try {
        fs.accessSync(file)
        return true
    } catch (err: any) {
        return false
    }
}
