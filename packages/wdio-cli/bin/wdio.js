#!/usr/bin/env node
/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test'
}

const cli = await import('../build/index.js')
cli.run()
