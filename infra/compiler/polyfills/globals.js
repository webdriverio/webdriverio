// Global polyfills for browser bundle
// Ensures globalThis.process and globalThis.Buffer exist for dependencies
import process from 'process'
import { Buffer } from 'buffer'

if (typeof globalThis.process === 'undefined') {
    globalThis.process = process
}

if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = Buffer
}

export { process, Buffer }
export default { process, Buffer }
