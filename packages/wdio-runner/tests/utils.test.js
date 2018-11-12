import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'

import { runHook, initialiseServices, initialiseInstance } from '../src/utils'

describe('utils', () => {
    describe('runHook', () => {
        it('should execute all hooks', async () => {
            const config = { before: [jest.fn(), jest.fn(), jest.fn()] }
            await runHook('before', config, 'foo', 'bar')

            const args = [[config, 'foo', 'bar']]
            expect(config.before.map((hook) => hook.mock.calls)).toEqual([args, args, args])
            logMock.error.mockClear()
        })

        it('should not fail if hooks throw', async () => {
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

    describe('initialiseServices', () => {
        it('should return empty array if no services prop is given', () => {
            expect(initialiseServices({})).toHaveLength(0)
        })

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

    describe('initialiseInstance', () => {
        it('should attach to an existing session if sessionId is within config', () => {
            initialiseInstance({
                sessionId: 123,
                foo: 'bar'
            }, [
                { browserName: 'chrome' }
            ])
            expect(attach).toBeCalledWith({
                sessionId: 123,
                foo: 'bar',
                capabilities: [{ browserName: 'chrome' }]
            })
            expect(multiremote).toHaveBeenCalledTimes(0)
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should run multiremote tests if flag is given', () => {
            const capabilities = { someBrowser: { browserName: 'chrome' } }
            initialiseInstance(
                { foo: 'bar' },
                capabilities,
                true
            )
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiremote).toBeCalledWith({
                someBrowser: {
                    browserName: 'chrome',
                    foo: 'bar'
                }
            })
            expect(remote).toHaveBeenCalledTimes(0)
        })

        it('should create normal remote session', () => {
            initialiseInstance({
                foo: 'bar'
            }, [
                { browserName: 'chrome' }
            ])
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiremote).toHaveBeenCalledTimes(0)
            expect(remote).toBeCalledWith({
                foo: 'bar',
                capabilities: [{ browserName: 'chrome' }]
            })
        })

        afterEach(() => {
            attach.mockClear()
            multiremote.mockClear()
            remote.mockClear()
        })

        // export async function initialiseInstance (config, capabilities, isMultiremote) {
        //     /**
        //      * check if config has sessionId and attach it to a running session if so
        //      */
        //     if (config.sessionId) {
        //         log.debug(`attach to session with id ${config.sessionId}`)
        //         return attach({ ...config, capabilities })
        //     }
        //
        //     if (!isMultiremote) {
        //         log.debug('init remote session')
        //         config.capabilities = capabilities
        //         return remote(config)
        //     }
        //
        //     const options = {}
        //     log.debug('init multiremote session')
        //     for (let browserName of Object.keys(capabilities)) {
        //         options[browserName] = merge(config, capabilities[browserName], MERGE_OPTIONS)
        //     }
        //
        //     const browser = await multiremote(options)
        //     for (let browserName of Object.keys(capabilities)) {
        //         global[browserName] = browser[browserName]
        //     }
        //
        //     return browser
        // }
    })
})
