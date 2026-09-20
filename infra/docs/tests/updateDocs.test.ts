import { describe, it, expect } from 'vitest'

import { splitInSeries, getDocsVersion, getBucketName, getDistributionId } from '../src/updateDocs.js'

describe('splitInSeries', () => {
    it('chunks a list into batches of the given size', () => {
        expect(splitInSeries([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]])
        expect(splitInSeries([], 3)).toEqual([])
    })
})

describe('docs deploy targeting', () => {
    it('derives the major docs version from the package version', () => {
        expect(getDocsVersion('9.32.0')).toBe('v9')
        expect(getDocsVersion('10.0.0-alpha.1')).toBe('v10')
    })

    it('uses the production bucket for the current major and a versioned bucket otherwise', () => {
        expect(getBucketName('9.32.0')).toBe('webdriver.io')
        expect(getBucketName('10.0.0')).toBe('v10.webdriver.io')
        expect(getBucketName('8.1.0')).toBe('v8.webdriver.io')
    })

    it('picks the matching CloudFront distribution id', () => {
        const env = {
            DISTRIBUTION_ID: 'prod-dist',
            DISTRIBUTION_ID_V8: 'v8-dist',
            DISTRIBUTION_ID_V10: 'v10-dist'
        }
        expect(getDistributionId('9.1.0', env)).toBe('prod-dist')
        expect(getDistributionId('8.1.0', env)).toBe('v8-dist')
        expect(getDistributionId('10.0.0', env)).toBe('v10-dist')
    })
})
