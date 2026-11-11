/**
 * Used by `real-jasmine.test.ts`: Jasmine names the helper file for the suites the helper declares
 */
import { sharedSuite } from './sharedSuite.js'

sharedSuite()
describe('outer', () => {
    sharedSuite()
    it('in the spec', () => {})
})
