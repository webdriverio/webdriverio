import { describe, it, expect } from 'vitest'

import {
    formatBrokenPackages, IGNORE_PACKAGES, findUntrackedPeers, formatUntrackedPeers,
    type BrokenPackages
} from '../src/index.js'

describe('formatBrokenPackages', () => {
    it('lists each missing dependency and the files that use it', () => {
        const broken: BrokenPackages[] = [{
            package: 'wdio-cli',
            packagePath: '/packages/wdio-cli',
            dependencies: [],
            devDependencies: [],
            missing: {
                chalk: ['/packages/wdio-cli/src/index.ts', '/packages/wdio-cli/src/utils.ts']
            },
            using: {},
            invalidFiles: {},
            invalidDirs: {}
        }]

        const message = formatBrokenPackages(broken)
        expect(message).toContain('Broken Dependencies in wdio-cli')
        expect(message).toContain('* chalk missing')
        expect(message).toContain('/packages/wdio-cli/src/index.ts')
        expect(message).toContain('/packages/wdio-cli/src/utils.ts')
    })

    it('returns an empty string when nothing is broken', () => {
        expect(formatBrokenPackages([])).toBe('')
    })
})

describe('IGNORE_PACKAGES', () => {
    it('ignores known virtual modules in the browser runner', () => {
        expect(IGNORE_PACKAGES['wdio-browser-runner']).toContain('virtual:wdio')
        expect(IGNORE_PACKAGES['wdio-browser-runner']).toContain('@stencil/core')
    })
})

describe('findUntrackedPeers', () => {
    it('flags a peer that no manifest declares in dependencies or devDependencies', () => {
        expect(findUntrackedPeers([
            { name: '@wdio/session', peerDependencies: { appium: '^3.0.0' } }
        ])).toEqual([{ package: '@wdio/session', peer: 'appium', range: '^3.0.0' }])
    })

    it('accepts a peer that the same or another manifest declares', () => {
        expect(findUntrackedPeers([
            { name: '@wdio/session', peerDependencies: { appium: '^3.0.0' }, devDependencies: { appium: '^3.8.0' } },
            { name: '@wdio/globals', peerDependencies: { 'expect-webdriverio': '^8.0.0' } },
            { name: '@wdio/runner', dependencies: { 'expect-webdriverio': '^8.0.0' } }
        ])).toEqual([])
    })

    it('does not count a range that Dependabot never updates', () => {
        expect(findUntrackedPeers([
            { name: '@wdio/session', peerDependencies: { '@wdio/electron-service': '*' } },
            { name: 'e2e', devDependencies: { '@wdio/electron-service': '*' } }
        ])).toEqual([{ package: '@wdio/session', peer: '@wdio/electron-service', range: '*' }])
    })

    it('ignores a peer that is a workspace package', () => {
        expect(findUntrackedPeers([
            { name: '@wdio/globals', peerDependencies: { webdriverio: '^10.0.0' } },
            { name: 'webdriverio' }
        ])).toEqual([])
    })
})

describe('formatUntrackedPeers', () => {
    it('names the package, the peer and the fix', () => {
        const message = formatUntrackedPeers([{ package: '@wdio/session', peer: 'appium', range: '^3.0.0' }])
        expect(message).toContain('@wdio/session: peer appium (^3.0.0)')
        expect(message).toContain('add it to devDependencies')
    })
})
