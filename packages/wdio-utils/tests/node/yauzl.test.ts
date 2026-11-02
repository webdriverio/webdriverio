import fs from 'node:fs'
import { describe, it, expect, vi, afterEach } from 'vitest'

import { extractZipUsesFaultyYauzl } from '../../src/node/yauzl.js'

describe('extractZipUsesFaultyYauzl', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    // this repository overrides yauzl to 3.x, which works on Node 26
    it('is false for the yauzl that extract-zip loads in this repository', () => {
        expect(extractZipUsesFaultyYauzl()).toBe(false)
    })

    /**
     * real run, extract-zip 2.0.1 on Node 26: yauzl 2.10.0, 3.0.0, 3.1.3, 3.2.1 and 3.3.0 hang,
     * 3.3.1 and 3.4.0 work (yauzl#169: read streams emit `close` from 3.3.1)
     */
    it.each([
        ['2.10.0', true],
        ['3.0.0', true],
        ['3.2.1', true],
        ['3.3.0', true],
        ['3.3.1', false],
        ['3.4.0', false],
        ['4.0.0', false]
    ])('is %s faulty: %s', (version, faulty) => {
        const readFileSync = fs.readFileSync
        vi.spyOn(fs, 'readFileSync').mockImplementation(((file: string, ...rest: unknown[]) => String(file).includes('yauzl')
            ? JSON.stringify({ name: 'yauzl', version })
            : (readFileSync as (...args: unknown[]) => unknown)(file, ...rest)) as typeof fs.readFileSync)

        expect(extractZipUsesFaultyYauzl()).toBe(faulty)
    })

    it('is false when the version can not be read', () => {
        vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
            throw new Error('EACCES')
        })

        expect(extractZipUsesFaultyYauzl()).toBe(false)
    })
})
