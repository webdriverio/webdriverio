import { canAccess } from '@wdio/utils'

import { darwinGetAppPaths, darwinGetInstallations } from '../../src/finder/finder'

const systemProfiler = require('./systemProfiler.json')

jest.mock('child_process',  jest.fn().mockImplementation(() => ({
    execSync() {
        return JSON.stringify(systemProfiler)
    }
})))

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
        canAccess.mockImplementation((s = '') => s.startsWith('/ok'))
    })
    test('darwinGetInstallations', () => {
        expect(darwinGetInstallations(['/ok', '/not-ok'], ['foobar'])).toEqual(['/ok/foobar'])
    })
})
