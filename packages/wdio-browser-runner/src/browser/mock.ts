/**
 * this file content is assigned to modules we mock out for browser compatibility
 */

export const createRequire = () => {
    return () => {}
}

export const SUPPORTED_BROWSER = []
export const locatorStrategy = {}
export class EventEmitter {}
export const URL = window.URL
export const pathToFileURL = () => ''
export const getTitle = () => 'haha'
export default () => {}
