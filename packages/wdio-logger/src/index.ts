/* istanbul ignore file */

import type loggerType from './node.js'
export type { Logger } from './node.js'

/**
 * environment check to allow to use this package in a web context
 */
// By default, import the web code using a literal require, so that in webpack
// contexts, it will always be bundled
let mode = await import('./web.js') as any

// Then, if we're in a Node.js context, require the node version of this module
// using a variable, so that it will _not_ be included in a bundle, either
// during compilation or execution
if (typeof process !== 'undefined' && typeof process.release !== 'undefined' && process.release.name === 'node') {
    const nodeMode = './node.js'
    mode = await import(nodeMode)
}

// The net result will be that in a Node context, we'll have required both
// files but will use the correct one, and in the web context, we'll have only
// required the web file, thus ensuring that the Node file and related
// dependencies will not be bundled inadvertently.
export default mode.default as typeof loggerType
