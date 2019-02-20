import { logMock } from '@wdio/logger'
import { attach, remote, multiremote } from 'webdriverio'

import { runHook, initialiseInstance, sanitizeCaps } from '../src/utils'

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
