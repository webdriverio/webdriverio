import os from 'node:os'
import { describe, expect, it, vi } from 'vitest'

import { toVitestConfig } from '../src/config.js'
import { WdioBridgeReporter } from '../src/reporter.js'

vi.mock('@wdio/utils', () => ({
    resolveMaxContexts: vi.fn((value: unknown, fallback: number) => typeof value === 'number' ? value : fallback)
}))

vi.mock('@wdio/runner', () => ({ BaseReporter: class {} }))

const specs = ['/repo/a.spec.ts', '/repo/b.spec.ts']
const configFile = '/repo/wdio.conf.ts'
const build = (config: Partial<WebdriverIO.Config>) => toVitestConfig({
    config: { capabilities: [{ browserName: 'chrome' }], ...config } as WebdriverIO.Config,
    specs,
    configFile
})

describe('toVitestConfig', () => {
    it('maps specs and the fixed Vitest options', () => {
        const { test } = build({})
        expect(test).toMatchObject({
            include: specs,
            pool: 'forks',
            isolate: true,
            globals: true,
            environment: 'node',
            testTimeout: 60_000,
            hookTimeout: 120_000
        })
        expect(test!.setupFiles).toEqual([expect.stringMatching(/setup\.js$/)])
        expect(build({ connectionRetryTimeout: 30_000 }).test).toMatchObject({ hookTimeout: 30_000 })
    })

    it('keeps the setup file when vitestOpts.setupFiles is a string or an array', () => {
        expect(build({ vitestOpts: { setupFiles: './mine.ts' } }).test!.setupFiles).toEqual([expect.stringMatching(/setup\.js$/), './mine.ts'])
        expect(build({ vitestOpts: { setupFiles: ['./a.ts', './b.ts'] } }).test!.setupFiles).toEqual([expect.stringMatching(/setup\.js$/), './a.ts', './b.ts'])
    })

    it('ignores vitestOpts.include and vitestOpts.pool', () => {
        const { test } = build({ vitestOpts: { include: ['**/other.ts'], pool: 'threads' } })
        expect(test).toMatchObject({ include: specs, pool: 'forks' })
    })

    it('maps maxInstances to maxWorkers only when it is a positive number', () => {
        expect(build({ maxInstances: 4 }).test!.maxWorkers).toBe(4)
        expect(build({ maxInstances: 0 }).test).not.toHaveProperty('maxWorkers')
        expect(build({ maxInstances: Infinity }).test).not.toHaveProperty('maxWorkers')
    })

    it('maps bail only when greater than 0', () => {
        expect(build({ bail: 2 }).test!.bail).toBe(2)
        expect(build({ bail: 0 }).test).not.toHaveProperty('bail')
    })

    it('creates one project per capability with provided caps and config file', () => {
        const caps = [
            { browserName: 'chrome', 'wdio:maxInstances': 2 },
            { browserName: 'firefox' },
            { 'wdio:maxInstances': 0 }
        ]
        const { projects } = build({ capabilities: caps as never }).test!
        expect(projects).toEqual([
            { extends: true, test: expect.objectContaining({ name: 'chrome-0', maxWorkers: 2, provide: { wdioCapabilities: caps[0], wdioConfigFile: configFile } }) },
            { extends: true, test: expect.objectContaining({ name: 'firefox-1' }) },
            { extends: true, test: expect.objectContaining({ name: 'browser-2' }) }
        ])
        expect((projects![1] as { test: object }).test).not.toHaveProperty('maxWorkers')
        for (const project of projects!) {
            expect((project as { test: object }).test).not.toHaveProperty('include')
            expect((project as { test: object }).test).not.toHaveProperty('setupFiles')
        }
    })

    it('unwraps alwaysMatch capabilities', () => {
        const cap = { browserName: 'chrome' }
        const { projects } = build({ capabilities: [{ alwaysMatch: cap }] as never }).test!
        expect((projects![0] as { test: { provide: unknown } }).test.provide).toEqual({ wdioCapabilities: cap, wdioConfigFile: configFile })
    })

    it.each([
        ['an object', { a: { capabilities: { browserName: 'chrome' } } }],
        ['parallel multi-remote entries', [{ a: { capabilities: { browserName: 'chrome' } } }]]
    ])('throws for multi-remote capabilities (%s)', (_, capabilities) => {
        expect(() => build({ capabilities: capabilities as never })).toThrow('@wdio/vitest-framework does not support multi-remote capabilities yet')
    })

    it('lets vitestOpts override root options without leaking WDIO-only keys', () => {
        const { test } = build({ vitestOpts: { testTimeout: 5, globals: false, parallelMode: 'contexts', maxParallelContexts: 3 } })
        expect(test).toMatchObject({ testTimeout: 5, globals: false, maxConcurrency: 3 })
        expect(test).not.toHaveProperty('parallelMode')
        expect(test).not.toHaveProperty('maxParallelContexts')
    })

    it('falls back to the CPU count for maxConcurrency and omits it without parallelMode', () => {
        expect(build({ vitestOpts: { parallelMode: 'userContexts' } }).test!.maxConcurrency).toBe(os.cpus().length)
        expect(build({ vitestOpts: { maxParallelContexts: 3 } }).test).not.toHaveProperty('maxConcurrency')
    })

    describe('reporters', () => {
        const buildWithEvents = (config: Partial<WebdriverIO.Config>) => toVitestConfig({
            config: { capabilities: [{ browserName: 'chrome' }], ...config } as WebdriverIO.Config,
            specs,
            configFile,
            onEvent: vi.fn()
        }).test!.reporters as unknown[]

        it('leaves reporters alone without an event sink', () => {
            expect(build({}).test).not.toHaveProperty('reporters')
            expect(build({ vitestOpts: { reporters: ['json'] } }).test!.reporters).toEqual(['json'])
        })

        it('keeps the default Vitest reporter next to the bridge', () => {
            const reporters = buildWithEvents({})
            expect(reporters).toEqual(['default', expect.any(WdioBridgeReporter)])
        })

        it('appends the bridge to the user reporters', () => {
            expect(buildWithEvents({ vitestOpts: { reporters: ['json'] } })).toEqual(['json', expect.any(WdioBridgeReporter)])
            expect(buildWithEvents({ vitestOpts: { reporters: [['json', { outputFile: 'a.json' }]] } })).toEqual([['json', { outputFile: 'a.json' }], expect.any(WdioBridgeReporter)])
            expect(buildWithEvents({ vitestOpts: { reporters: 'verbose' } })).toEqual(['verbose', expect.any(WdioBridgeReporter)])
        })
    })
})
