import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'

import { runHook, initialiseServices, initialiseInstance, sanitizeCaps } from '../src/utils'

class CustomService {
    constructor (config, caps) {
        this.config = config
        this.caps = caps
    }
}


describe('utils', () => {
    beforeEach(() => {
        logMock.error.mockClear()
    })

    describe('runHook', () => {
        it('should execute all hooks', async () => {
            const config = { before: [jest.fn(), jest.fn(), jest.fn()] }
            await runHook('before', config, 'foo', 'bar')

            const args = [[config, 'foo', 'bar']]
            expect(config.before.map((hook) => hook.mock.calls)).toEqual([args, args, args])
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

        it('should allow custom services without options', () => {
            const services = initialiseServices(
                { services: [CustomService], foo: 'bar' },
                ['./spec.js']
            )
            expect(services).toHaveLength(1)
            expect(services[0].config.foo).toBe('bar')
        })

        it('should allow custom services with options', () => {
            const services = initialiseServices(
                { services: [[CustomService, { foo: 'foo' }]], foo: 'bar' },
                ['./spec.js']
            )
            expect(services).toHaveLength(1)
            expect(services[0].config.foo).toBe('foo')
        })

        it('should ignore service with launcher only', () => {
            const services = initialiseServices({ services: ['launcher-only'] })
            expect(services).toHaveLength(0)
            expect(logMock.error).toHaveBeenCalledTimes(0)
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
            },
            {
                browserName: 'chrome',
                maxInstances: 123
            })
            expect(attach).toHaveBeenCalledTimes(0)
            expect(multiremote).toHaveBeenCalledTimes(0)
            expect(remote).toBeCalledWith({
                foo: 'bar',
                capabilities: { browserName: 'chrome' }
            })
        })

        afterEach(() => {
            attach.mockClear()
            multiremote.mockClear()
            remote.mockClear()
        })
    })

    it('sanitizeCaps', () => {
        const validCaps = {
            browserName: 'chrome',
            browserVersion: 'latest',
            platformName: 'macOS 10.13'
        }

        const invalidCaps = {
            maxInstances: 123,
            specs: ['./foo.test.js', './bar.test.js']
        }

        expect(sanitizeCaps({
            ...invalidCaps,
            ...validCaps
        })).toEqual(validCaps)
    })
})
