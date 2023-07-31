/**
 * this file content is assigned to modules we mock out for browser compatibility
 */
export const createRequire = () => {
    const require = () => {}
    require.resolve = () => {}
    return require
}

export const SUPPORTED_BROWSER = []
export const locatorStrategy = {}
export class EventEmitter {}
export const URL = window.URL
export const pathToFileURL = () => ''
export const fileURLToPath = () => ''
export const dirname = () => ''
export const resolve = () => ''
export const sep = '/'
export const start = () => {}
export const install = () => {}
export const computeExecutablePath = () => {}
export const Browser = () => {}
export const getInstalledBrowsers = () => {}
export const canDownload = () => {}
export const resolveBuildId = () => {}
export const ChromeReleaseChannel = () => {}
export const detectBrowserPlatform = () => {}
export const type = 'browser'
export const sync = () => {}
export default () => {}
