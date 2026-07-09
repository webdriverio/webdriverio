import { describe, expect, it, beforeEach, afterEach } from 'vitest'

import {
    parseCommaSeparatedValues,
    mergeValues,
    mergeIntoTags,
    normalizeTitleTagConfig,
    publishTitleTagConfig,
    resolveTitleTagConfig,
    extractCaseIdsFromTitle,
} from '../src/customTags.js'
import type { CustomMetadata } from '../src/customTags.js'

const ENV_KEY = 'BROWSERSTACK_TESTHUB_CASE_ID_FROM_TITLE'

describe('customTags - value parsing + merge (property-based)', () => {
    it('quote-aware split preserves commas inside double quotes', () => {
        expect(parseCommaSeparatedValues('"checkout,cart", header')).toEqual(['checkout,cart', 'header'])
    })

    it('trims and drops empties on unquoted input', () => {
        expect(parseCommaSeparatedValues('TC-1, TC-2 ,, TC-3')).toEqual(['TC-1', 'TC-2', 'TC-3'])
    })

    it('mergeValues unions and de-dupes, existing-first', () => {
        expect(mergeValues(['A', 'B'], ['B', 'C'])).toEqual(['A', 'B', 'C'])
    })

    it('mergeIntoTags builds the multi_dropdown shape and merges', () => {
        const container: CustomMetadata = {}
        mergeIntoTags(container, 'test_case_id', ['C1'])
        mergeIntoTags(container, 'test_case_id', ['C1', 'C2'])
        expect(container).toEqual({ test_case_id: { field_type: 'multi_dropdown', values: ['C1', 'C2'] } })
    })
})

describe('customTags - title-based config normalization', () => {
    it('returns undefined when disabled/absent', () => {
        expect(normalizeTitleTagConfig(undefined)).toBeUndefined()
        expect(normalizeTitleTagConfig(null)).toBeUndefined()
        expect(normalizeTitleTagConfig(false)).toBeUndefined()
    })

    it('true resolves to TestRail defaults', () => {
        expect(normalizeTitleTagConfig(true)).toEqual({ pattern: 'C\\d+', key: 'test_case_id' })
    })

    it('object overrides pattern and key', () => {
        expect(normalizeTitleTagConfig({ pattern: 'TC-\\d+', key: 'case' }))
            .toEqual({ pattern: 'TC-\\d+', key: 'case' })
    })

    it('blank object fields fall back to defaults', () => {
        expect(normalizeTitleTagConfig({ pattern: '  ', key: '' }))
            .toEqual({ pattern: 'C\\d+', key: 'test_case_id' })
    })
})

describe('customTags - title-based env round-trip', () => {
    beforeEach(() => { delete process.env[ENV_KEY] })
    afterEach(() => { delete process.env[ENV_KEY] })

    it('resolves undefined when nothing published', () => {
        expect(resolveTitleTagConfig()).toBeUndefined()
    })

    it('publish then resolve round-trips the config', () => {
        publishTitleTagConfig({ pattern: 'C\\d+', key: 'test_case_id' })
        expect(resolveTitleTagConfig()).toEqual({ pattern: 'C\\d+', key: 'test_case_id' })
    })

    it('publishing undefined does not set the env (stays disabled)', () => {
        publishTitleTagConfig(undefined)
        expect(process.env[ENV_KEY]).toBeUndefined()
        expect(resolveTitleTagConfig()).toBeUndefined()
    })

    it('malformed env value resolves to undefined', () => {
        process.env[ENV_KEY] = 'not-json'
        expect(resolveTitleTagConfig()).toBeUndefined()
    })
})

describe('customTags - extractCaseIdsFromTitle', () => {
    it('extracts multiple TestRail IDs from a title', () => {
        expect(extractCaseIdsFromTitle('C36077 C36078 C36079 opens home', 'C\\d+'))
            .toEqual(['C36077', 'C36078', 'C36079'])
    })

    it('extracts a single ID', () => {
        expect(extractCaseIdsFromTitle('C40001 renders title', 'C\\d+')).toEqual(['C40001'])
    })

    it('de-dupes repeated IDs', () => {
        expect(extractCaseIdsFromTitle('C1 does X then C1 again', 'C\\d+')).toEqual(['C1'])
    })

    it('returns [] when the title has no match', () => {
        expect(extractCaseIdsFromTitle('Checkout works', 'C\\d+')).toEqual([])
    })

    it('returns [] for empty title or pattern', () => {
        expect(extractCaseIdsFromTitle('', 'C\\d+')).toEqual([])
        expect(extractCaseIdsFromTitle(undefined, 'C\\d+')).toEqual([])
        expect(extractCaseIdsFromTitle('C1 test', '')).toEqual([])
    })

    it('honors a custom pattern', () => {
        expect(extractCaseIdsFromTitle('TC-101 TC-102 flow', 'TC-\\d+')).toEqual(['TC-101', 'TC-102'])
    })

    it('is a safe no-op on an invalid regex', () => {
        expect(extractCaseIdsFromTitle('C1 test', '(')).toEqual([])
    })
})
