// Global polyfills for browser bundle
// Ensures globalThis.process and globalThis.Buffer exist for dependencies
import process from './process.js'
import { Buffer } from './buffer.js'

if (typeof globalThis.process === 'undefined') {
    globalThis.process = process
}

if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = Buffer
}

export { process, Buffer }
export default { process, Buffer }
