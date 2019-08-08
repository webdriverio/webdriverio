import { EventEmitter } from 'events'
import { ConfigParser } from '@wdio/config'
import { DEFAULT_OPTS } from './constants'
import { getTestCases } from './utils'

/**
 * Filter Specs By TagExpression
 * @param {Object} config wdio configuration object
 * @return {string[]} Array of filtered specs
 */
export async function filterSpecsByTag (config) {
    const cucumberOpts = { ...DEFAULT_OPTS, ...config.cucumberOpts }
    if (!cucumberOpts.tagExpression) {
        return config.specs
    }
    const specs = ConfigParser.getFilePaths(config.specs, false)
    const testCases = await getTestCases(config, cucumberOpts, specs, new EventEmitter(), process.cwd())
    const filteredSpecs = [...new Set(testCases.map(testCase => testCase.uri))]
    return filteredSpecs
}
