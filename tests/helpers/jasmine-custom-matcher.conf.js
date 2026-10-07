import { expect } from '@wdio/globals'

import { config as baseConfig } from './config.js'

/**
 * Adds a custom matcher in the `before` hook, as the Custom Matchers page says.
 */
export const config = {
    ...baseConfig,
    framework: 'jasmine',
    before () {
        expect.extend({
            toBeFoo (actual) {
                return { pass: actual === 'foo', message: () => `expected ${actual} to be "foo"` }
            }
        })
    }
}
