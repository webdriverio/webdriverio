import path from 'node:path'

import { deepmerge } from 'deepmerge-ts'
import { expect, describe, it, vi, beforeEach } from 'vitest'

import { makeHeadless, getCoverageByFactor, adjustWindowInWatchMode } from '../src/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('deepmerge-ts', () => ({
    deepmerge: vi.fn()
}))

beforeEach(() => {
    vi.mocked(deepmerge).mockClear()
    delete process.env.CI
})

describe('makeHeadless', () => {
    it('throws if browser name is not used in caps', () => {
        expect(() => makeHeadless({}, {})).toThrow()
        expect(deepmerge).toBeCalledTimes(0)
    })

    it('makes chrome, firefox and edge caps headless', () => {
        process.env.CI = '1'
        makeHeadless({}, { browserName: 'chrome' })
        expect(deepmerge).toBeCalledTimes(1)
        delete process.env.CI
        makeHeadless({ headless: true }, { browserName: 'firefox' })
        expect(deepmerge).toBeCalledTimes(2)
        makeHeadless({}, { browserName: 'edge' })
        expect(deepmerge).toBeCalledTimes(2)
        process.env.CI = '1'
        makeHeadless({}, { browserName: 'edge' })
        expect(deepmerge).toBeCalledTimes(3)
        makeHeadless({}, { browserName: 'msedge' })
        expect(deepmerge).toBeCalledTimes(4)
        makeHeadless({}, { browserName: 'safari' })
        expect(deepmerge).toBeCalledTimes(4)
    })
})

describe('adjustWindowInWatchMode', () => {
    it('does not adjust window size if not in watch mode', () => {
        const caps: any = { foo: 'bar' }
        expect(adjustWindowInWatchMode({} as any, caps)).toEqual(caps)
    })

    it('adjusts window size if in watch mode', () => {
        adjustWindowInWatchMode({ watch: true } as any, { browserName: 'chrome' })
        expect(deepmerge).toBeCalledTimes(1)
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
