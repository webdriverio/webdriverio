import path from 'node:path'
import { expect, describe, beforeAll, test, vi } from 'vitest'
import { canAccess } from '@wdio/utils/node'

import getFinder from '../../src/finder/index.js'
import edgeFinder from '../../src/finder/edge.js'
import { darwinGetAppPaths, darwinGetInstallations } from '../../src/finder/finder.js'

const systemProfiler = await vi.importActual('./systemProfiler.json')

vi.mock('@wdio/utils/node', () => import(path.join(process.cwd(), '__mocks__', '@wdio', 'utils', 'node')))

vi.mock('child_process', vi.fn().mockImplementation(() => ({
    execSync() {
        return JSON.stringify(systemProfiler)
    }
})))

test('should get proper finder', () => {
    expect(() => getFinder('edge', 'freebsd')).toThrow(/not supported/)
    expect(getFinder('edge', 'linux')).toEqual(edgeFinder.linux)
})

describe('darwinGetAppPaths', () => {
    test('Firefox Nightly', () => {
        expect(darwinGetAppPaths('Firefox Nightly')).toEqual(['/Applications/Someone Renamed Firefox.app'])
    })

    test('Microsoft Edge', () => {
        expect(darwinGetAppPaths('Microsoft Edge')).toEqual(['/Applications/Microsoft Edge.app'])
    })
})

describe('darwinGetInstallations', () => {
    beforeAll(() => {
        vi.mocked(canAccess).mockImplementation((s = '') => s.startsWith(path.join('/', 'ok')))
    })
    test('darwinGetInstallations', () => {
        expect(darwinGetInstallations([path.join('/', 'ok'), path.join('/', 'not-ok')], ['foobar'])).toEqual([path.join('/ok', 'foobar')])
    })
})
