#!/usr/bin/env node
/**
 * wdiox — Interactive browser and app CLI for developers
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// Set log level before importing webdriverio (logger initializes on import)
process.env.WDIO_LOG_LEVEL ??= 'error'

;(async () => {
    const cli = await import('../build/index.js')
    return cli.run()
})()
