import { logMock } from 'wdio-logger'

import { runHook } from '../src/utils'

describe('utils', () => {
    it('runHook: should execute all hooks', async () => {
        const config = { before: [jest.fn(), jest.fn(), jest.fn()] }
        await runHook('before', config, 'foo', 'bar')

        const args = [[config, 'foo', 'bar']]
        expect(config.before.map((hook) => hook.mock.calls)).toEqual([args, args, args])
        logMock.error.mockClear()
    })

    it('runHook: should not fail if hooks throw', async () => {
        const config = {
            before: [
                jest.fn(),
                () => new Promise((resolve, reject) => reject(new Error('foobar321'))),
                () => {
                    throw new Error('foobar123')
                }
            ]
        }
        await runHook('before', config, 'foo', 'bar')
        expect(logMock.error.mock.calls).toHaveLength(2)
        expect(logMock.error.mock.calls[0][0]).toContain('foobar123')
        expect(logMock.error.mock.calls[1][0]).toContain('foobar321')
    })
})
