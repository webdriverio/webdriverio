import path from 'node:path'

import { expect, describe, it, vi, beforeEach } from 'vitest'

import { makeHeadless, getCoverageByFactor, adjustWindowInWatchMode, normalizeHost } from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

beforeEach(() => {
    delete process.env.CI
})

describe('makeHeadless', () => {
    it('throws if browser name is not used in caps', () => {
        expect(() => makeHeadless({}, {})).toThrow(/browserName/)
    })

    it('makes chrome, firefox and edge caps headless', () => {
        process.env.CI = '1'
        expect(makeHeadless({}, { browserName: 'chrome' })).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
        expect(makeHeadless({ headless: false }, { browserName: 'chrome' })).toEqual({
            browserName: 'chrome'
        })

        delete process.env.CI
        expect(makeHeadless({ headless: true }, { browserName: 'firefox' })).toEqual({
            browserName: 'firefox',
            'moz:firefoxOptions': {
                args: ['-headless']
            }
        })
        expect(makeHeadless({}, { browserName: 'edge' })).toEqual({
            browserName: 'edge'
        })

        process.env.CI = '1'
        expect(makeHeadless({}, { browserName: 'edge' })).toEqual({
            browserName: 'edge',
            'ms:edgeOptions': {
                args: ['--headless']
            }
        })
        expect(makeHeadless({}, { browserName: 'msedge' })).toEqual({
            browserName: 'msedge',
            'ms:edgeOptions': {
                args: ['--headless']
            }
        })
        expect(makeHeadless({}, { browserName: 'MicrosoftEdge' })).toEqual({
            browserName: 'MicrosoftEdge',
            'ms:edgeOptions': {
                args: ['--headless']
            }
        })
        expect(makeHeadless({}, { browserName: 'safari' })).toEqual({
            browserName: 'safari'
        })
    })

    it('matches browser names regardless of case', () => {
        process.env.CI = '1'
        expect(makeHeadless({}, { browserName: 'Chrome' })).toEqual({
            browserName: 'Chrome',
            'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
        })
        expect(makeHeadless({}, { browserName: 'Firefox' })).toEqual({
            browserName: 'Firefox',
            'moz:firefoxOptions': { args: ['-headless'] }
        })
    })

    it('keeps the alwaysMatch and firstMatch shape of W3C capabilities', () => {
        process.env.CI = '1'
        const firstMatch = [{ 'ms:edgeOptions': { binary: '/edge' } }]
        expect(makeHeadless({}, { alwaysMatch: { browserName: 'MicrosoftEdge' }, firstMatch } as any)).toEqual({
            alwaysMatch: {
                browserName: 'MicrosoftEdge',
                'ms:edgeOptions': { args: ['--headless'] }
            },
            firstMatch
        })
    })
})

describe('normalizeHost', () => {
    it('adds a protocol and drops a trailing slash', () => {
        expect(normalizeHost()).toBeUndefined()
        expect(normalizeHost('192.168.1.10')).toBe('http://192.168.1.10')
        expect(normalizeHost('http://192.168.1.10/')).toBe('http://192.168.1.10')
        expect(normalizeHost('https://my-box.corp')).toBe('https://my-box.corp')
    })
})

describe('adjustWindowInWatchMode', () => {
    it('does not adjust window size if not in watch mode', () => {
        const caps: any = { foo: 'bar' }
        expect(adjustWindowInWatchMode({} as any, caps)).toEqual(caps)
    })

    it('adjusts window size if in watch mode', () => {
        expect(adjustWindowInWatchMode({ watch: true } as any, { browserName: 'chrome' })).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['auto-open-devtools-for-tabs', 'window-size=1600,1200'],
                prefs: {
                    devtools: {
                        preferences: {
                            'panel-selectedTab': '"console"'
                        }
                    }
                }
            }
        })
    })
})

it('getCoverageByFactor', () => {
    expect(getCoverageByFactor(
        {
            statements: 55,
            lines: 88,
            functions: 44
        },
        {
            statements: { pct: 33 } as any,
            lines: { pct: 93 } as any,
            functions: { pct: 23 } as any,
            branches: { pct: 100 } as any
        }
    )).toEqual([
        'ERROR: Coverage for functions (23%) does not meet global threshold (44%)',
        'ERROR: Coverage for statements (33%) does not meet global threshold (55%)'
    ])

    expect(getCoverageByFactor(
        {
            statements: 55,
            lines: 88,
            functions: 44
        },
        {
            statements: { pct: 33 } as any,
            lines: { pct: 88 } as any,
            functions: { pct: 23 } as any,
            branches: { pct: 100 } as any
        },
        '/path/to/file.js'
    )).toEqual([
        'ERROR: Coverage for functions (23%) does not meet threshold (44%) for /path/to/file.js',
        'ERROR: Coverage for statements (33%) does not meet threshold (55%) for /path/to/file.js'
    ])
})
