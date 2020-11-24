import { canAccess as canAccessImport } from '@wdio/utils'
import path from 'path'

import getFinder from '../../src/finder'
import edgeFinder from '../../src/finder/edge'
import { darwinGetAppPaths, darwinGetInstallations } from '../../src/finder/finder'

const systemProfiler = require('./systemProfiler.json')
const canAccess = canAccessImport as jest.Mock

jest.mock('child_process',  jest.fn().mockImplementation(() => ({
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
        canAccess.mockImplementation((s = '') => s.startsWith(path.join('/', 'ok')))
    })
    test('darwinGetInstallations', () => {
        expect(darwinGetInstallations([path.join('/', 'ok'), path.join('/', 'not-ok')], ['foobar'])).toEqual([path.join('/ok', 'foobar')])
    })
})
