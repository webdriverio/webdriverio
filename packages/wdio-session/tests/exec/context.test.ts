import type * as NodeModule from 'node:module'
import type * as UtilsNode from '@wdio/utils/node'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ requireCalls: [] as string[] }))

vi.mock('node:module', async (importActual) => {
    const actual = await importActual<typeof NodeModule>()
    const createRequire = () => ((id: string) => {
        state.requireCalls.push(id)
        return { expect: Object.assign((v: unknown) => `matchers:${v}`, { soft: 'soft' }), setDefaultOptions: vi.fn() }
    }) as unknown as NodeJS.Require
    return { ...actual, default: { ...actual, createRequire }, createRequire }
})

const resolveOptionalDependency = vi.hoisted(() => vi.fn())
vi.mock('@wdio/utils/node', async (importActual) => ({
    ...await importActual<typeof UtilsNode>(),
    resolveOptionalDependency
}))

import vm from 'node:vm'
import { getExecContext } from '../../src/exec/context.js'
import type { Session } from '../../src/session.js'

const makeSession = () => {
    const store = new Map<string, unknown>()
    return {
        name: 'test',
        cwd: process.cwd(),
        artifactsDir: '/tmp',
        browser: { options: { waitforTimeout: 1234 } },
        get: (key: string) => store.get(key),
        set: (key: string, value: unknown) => store.set(key, value)
    } as unknown as Session
}

describe('exec context expect', () => {
    beforeEach(() => {
        state.requireCalls.length = 0
        resolveOptionalDependency.mockReset()
    })

    it('does not load expect-webdriverio when code does not use it', async () => {
        resolveOptionalDependency.mockResolvedValue('/p/expect-webdriverio/index.js')
        const ctx = await getExecContext(makeSession())
        expect(vm.runInContext('1 + 1', ctx.context)).toBe(2)
        expect(state.requireCalls).toEqual([])
    })

    it('loads it on first use of expect', async () => {
        resolveOptionalDependency.mockResolvedValue('/p/expect-webdriverio/index.js')
        const ctx = await getExecContext(makeSession())
        expect(vm.runInContext('expect(5)', ctx.context)).toBe('matchers:5')
        expect(vm.runInContext('expect.soft', ctx.context)).toBe('soft')
        expect(state.requireCalls).toEqual(['/p/expect-webdriverio/index.js'])
    })

    it('fails with MISSING_DEPENDENCY only when expect is used and the package is missing', async () => {
        resolveOptionalDependency.mockResolvedValue(null)
        const ctx = await getExecContext(makeSession())
        expect(vm.runInContext('1 + 1', ctx.context)).toBe(2)
        expect(() => vm.runInContext('expect(1)', ctx.context)).toThrow(expect.objectContaining({
            code: 'MISSING_DEPENDENCY',
            package: 'expect-webdriverio'
        }))
    })
})
