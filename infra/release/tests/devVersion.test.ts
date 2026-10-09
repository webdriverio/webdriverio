import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect } from 'vitest'

import { computeDevVersion, getDevVersion, getNextVersion, validateDistTag } from '../src/devVersion.js'

describe('getNextVersion', () => {
    it('bumps a stable version', () => {
        expect(getNextVersion('10.0.1', 'patch')).toBe('10.0.2')
        expect(getNextVersion('10.0.1', 'minor')).toBe('10.1.0')
        expect(getNextVersion('10.0.1', 'major')).toBe('11.0.0')
        expect(getNextVersion('10.0.1', 'premajor')).toBe('11.0.0')
    })

    it('finishes a prerelease of the same release line like semver.inc', () => {
        expect(getNextVersion('11.0.0-alpha.3', 'major')).toBe('11.0.0')
        expect(getNextVersion('11.0.0-alpha.3', 'minor')).toBe('11.0.0')
        expect(getNextVersion('11.0.0-alpha.3', 'patch')).toBe('11.0.0')
        expect(getNextVersion('10.1.0-alpha.3', 'major')).toBe('11.0.0')
        expect(getNextVersion('10.1.1-alpha.3', 'minor')).toBe('10.2.0')
    })

    it('throws on an invalid version', () => {
        expect(() => getNextVersion('next', 'patch')).toThrow(/Invalid version/)
    })
})

describe('getDevVersion', () => {
    it('uses the workflow run number instead of the commit count', () => {
        expect(getDevVersion({ version: '10.0.1', runNumber: 42 })).toBe('10.0.2-dev.42')
        expect(getDevVersion({ version: '10.0.1', releaseType: 'minor', runNumber: '7' })).toBe('10.1.0-dev.7')
    })

    it('gives two branches with the same commit count different versions', () => {
        const branchA = getDevVersion({ version: '1.0.0', runNumber: 4 })
        const branchB = getDevVersion({ version: '1.0.0', runNumber: 5 })
        expect(branchA).not.toBe(branchB)
    })

    it('gives a re-run of the same workflow run its own version', () => {
        expect(getDevVersion({ version: '10.0.1', runNumber: 42, runAttempt: 1 })).toBe('10.0.2-dev.42')
        expect(getDevVersion({ version: '10.0.1', runNumber: 42, runAttempt: '2' })).toBe('10.0.2-dev.42.2')
    })

    it('rejects unknown release types and missing run numbers', () => {
        expect(() => getDevVersion({ version: '10.0.1', releaseType: 'prerelease', runNumber: 1 })).toThrow(/release type/)
        expect(() => getDevVersion({ version: '10.0.1', runNumber: '' })).toThrow(/run number/)
        expect(() => getDevVersion({ version: '10.0.1', runNumber: '01' })).toThrow(/run number/)
    })
})

describe('validateDistTag', () => {
    it('accepts plain tag names', () => {
        expect(validateDistTag('next')).toBe('next')
        expect(validateDistTag(' dev-bidi ')).toBe('dev-bidi')
    })

    it('rejects latest, flags and version-like tags', () => {
        expect(() => validateDistTag('latest')).toThrow(/latest/)
        expect(() => validateDistTag('next --canary')).toThrow(/Invalid npm dist-tag/)
        expect(() => validateDistTag('1.2.3')).toThrow(/version/)
        expect(() => validateDistTag('v10')).toThrow(/version/)
    })
})

describe('computeDevVersion', () => {
    it('reads the version from lerna.json and the run from the GitHub env', async () => {
        const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-dev-version-'))
        await fs.writeFile(path.join(rootDir, 'lerna.json'), JSON.stringify({ version: '10.0.1' }))
        await expect(computeDevVersion({
            RELEASE_TYPE: 'patch',
            DIST_TAG: 'next',
            GITHUB_RUN_NUMBER: '13',
            GITHUB_RUN_ATTEMPT: '1'
        }, rootDir)).resolves.toEqual({ version: '10.0.2-dev.13', distTag: 'next' })
    })
})
