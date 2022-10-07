#!/usr/bin/env node
/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test'
}

/**
 * use IIFE to allow running this within CJS and ESM context
 */
(async () => {
    const cli = await import('../build/index.js')
    return cli.run()
})()
