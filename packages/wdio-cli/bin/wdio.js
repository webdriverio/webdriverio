#!/usr/bin/env node
/**
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (process.env.NODE_ENV == null) {
    process.env.NODE_ENV = 'test'
}

require('../build').run()
