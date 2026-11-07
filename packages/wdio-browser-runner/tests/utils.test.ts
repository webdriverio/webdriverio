import path from 'node:path'

import { expect, describe, it, vi, beforeEach } from 'vitest'

import {
    makeHeadless,
    getCoverageByFactor,
    adjustWindowInWatchMode,
    hasInspectorOption,
    getInspectorPort,
    configureBrowserInspector
} from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('get-port', () => ({
    portNumbers: (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i),
    default: vi.fn(async (options?: { port?: number | Iterable<number>, exclude?: Iterable<number> }) => {
        const exclude = new Set(options?.exclude || [])
        const ports = typeof options?.port === 'number'
            ? [options.port]
            : options?.port || [9222]
        for (const port of ports) {
            if (!exclude.has(port)) {
                return port
            }
        }
        return 9222
    })
}))

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
        expect(makeHeadless({}, { browserName: 'safari' })).toEqual({
            browserName: 'safari'
        })
        expect(makeHeadless({ inspect: true }, { browserName: 'chrome' })).toEqual({
            browserName: 'chrome'
        })
        expect(makeHeadless({ inspect: true, headless: true }, { browserName: 'chrome' })).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        })
    })
})

describe('configureBrowserInspector', () => {
    it('detects when inspector option or execArgv is present', () => {
        expect(hasInspectorOption({}, {} as any, [])).toBe(false)
        expect(hasInspectorOption({ inspect: true }, {} as any, [])).toBe(true)
        expect(hasInspectorOption({ inspect: 9333 }, {} as any, [])).toBe(true)
        expect(hasInspectorOption({}, { execArgv: ['--inspect'] } as any, [])).toBe(true)
        expect(hasInspectorOption({}, {} as any, ['--inspect-brk=127.0.0.1:9229'])).toBe(true)
    })

    it('resolves unique browser inspector port without colliding with Node debugger port', async () => {
        const allocatedPorts = new Set<number>()
        expect(await getInspectorPort({ inspect: 9555 }, {} as any, [])).toBe(9555)
        expect(await getInspectorPort({}, { execArgv: ['--inspect=9333'] } as any, [])).toBe(9222)
        expect(await getInspectorPort({}, { execArgv: ['--inspect=9222'] } as any, [])).toBe(9223)
        expect(await getInspectorPort({ inspect: true }, {} as any, [], allocatedPorts)).toBe(9222)
        expect(await getInspectorPort({ inspect: true }, {} as any, [], allocatedPorts)).toBe(9223)
        expect(await getInspectorPort({ inspect: true }, {} as any, [], allocatedPorts)).toBe(9224)
        allocatedPorts.delete(9222)
        expect(await getInspectorPort({ inspect: true }, {} as any, [], allocatedPorts)).toBe(9222)
        expect(await getInspectorPort({ inspect: 65535 }, {} as any, ['--inspect=65535'])).toBe(1024)
    })

    it('adds remote debugging port to browser capabilities when inspect is enabled', async () => {
        const allocatedPorts = new Set<number>()
        expect(await configureBrowserInspector({}, {} as any, { browserName: 'chrome' }, [], allocatedPorts)).toEqual({
            browserName: 'chrome'
        })
        expect(await configureBrowserInspector({ inspect: true }, {} as any, { browserName: 'chrome' }, [], allocatedPorts)).toEqual({
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['--remote-debugging-port=9222']
            }
        })
        expect(await configureBrowserInspector({ inspect: 9333 }, {} as any, { browserName: 'msedge' }, [], allocatedPorts)).toEqual({
            browserName: 'msedge',
            'ms:edgeOptions': {
                args: ['--remote-debugging-port=9333']
            }
        })
        expect(await configureBrowserInspector({ inspect: true }, {} as any, { browserName: 'firefox' }, [], allocatedPorts)).toEqual({
            browserName: 'firefox',
            'moz:firefoxOptions': {
                args: ['-remote-debugging-port', '9223']
            }
        })
        expect(await configureBrowserInspector(
            { inspect: true },
            {} as any,
            {
                alwaysMatch: { browserName: 'chrome' },
                firstMatch: [{ browserVersion: 'stable' }]
            } as any,
            []
        )).toEqual({
            alwaysMatch: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--remote-debugging-port=9222']
                }
            },
            firstMatch: [{ browserVersion: 'stable' }]
        })
        const existingCaps: WebdriverIO.Capabilities = {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['--remote-debugging-port=9999']
            }
        }
        expect(await configureBrowserInspector({ inspect: true }, {} as any, existingCaps, [], allocatedPorts)).toEqual(existingCaps)
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
