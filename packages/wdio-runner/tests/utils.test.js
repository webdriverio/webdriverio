import { logMock } from '@wdio/logger'

import { runHook, initialiseServices } from '../src/utils'

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

    describe('initialiseServices', () => {
        it('should be able to add custom services', () => {
            const service = {
                before: jest.fn(),
                afterTest: jest.fn()
            }

            const services = initialiseServices({ services: [service] })
            expect(services).toHaveLength(1)
            expect(services[0].before).toBeTruthy()
            expect(services[0].afterTest).toBeTruthy()
        })

        it('should be able to add wdio services', () => {
            const services = initialiseServices({ services: ['foobar'] })
            expect(services).toHaveLength(1)

            const service = services[0]
            // check if /packages/wdio-config/tests/__mocks__/wdio-config.js how the mock looks like
            expect(typeof service.beforeSuite).toBe('function')
            expect(typeof service.afterCommand).toBe('function')
            // not defined method
            expect(typeof service.before).toBe('undefined')
        })
    })
})
