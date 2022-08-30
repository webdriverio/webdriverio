import RequireLibrary from '../src/lib/RequireLibrary.js'
import { vi, describe, it, expect } from 'vitest'

vi.mock('ts-node', () => ({ default: 'mock module' }))

describe('RequireLibrary', () => {
    /**
     * fails due to vitest bug:
     * https://github.com/vitest-dev/vitest/issues/1294
     */
    describe.skip('require', function () {
        it('should try to require when module exists', async function () {
            const svc = new RequireLibrary()
            expect(await svc.import('ts-node')).toEqual('mock module')
        })

        it('should what to require', async function () {
            const svc = new RequireLibrary()
            await expect(async () => await svc.import('abcdef xyz'))
                .toThrowError("Cannot find module 'abcdef xyz' from 'packages/wdio-config/src/lib/RequireLibrary.ts'")
        })
    })
})
