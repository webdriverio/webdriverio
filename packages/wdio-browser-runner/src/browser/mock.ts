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
export const type = 'browser'
export default () => {}
