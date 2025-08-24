import { DATA_ENDPOINT } from '../src/constants.js'
import CrashReporter from '../src/crash-reporter.js'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import * as bstackLogger from '../src/bstackLogger.js'

vi.mock('fetch')

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

describe('CrashReporter', () => {
    afterEach(() => {
        vi.resetAllMocks()
        delete process.env.CREDENTIALS_FOR_CRASH_REPORTING
        delete process.env.userConfigForReporting
    })

    describe('uploadCrashReport', () => {
        it ('should return if creds are not valid', () => {
            process.env.CREDENTIALS_FOR_CRASH_REPORTING = 'some invalid credentials'
            expect(() => {
                CrashReporter.uploadCrashReport('some exception', 'some stack')
            }).not.toThrow()
        })

        it('should return if no username or key', () => {
            process.env.CREDENTIALS_FOR_CRASH_REPORTING = '{}'
            expect(() => {
                CrashReporter.uploadCrashReport('some exception', 'some stack')
            }).not.toThrow()
        })

        describe('valid credentials', () => {
            beforeEach(() => {
                process.env.CREDENTIALS_FOR_CRASH_REPORTING = JSON.stringify({ 'username': 'user', 'password': 'password' })
                process.env.userConfigForReporting = JSON.stringify({})
            })

            it('should not raise any exception', () => {
                vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ status: 'success' })))

                expect(() => CrashReporter.uploadCrashReport('some exception', 'some stack')).not.toThrow()
                expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('POST')

            })

            it('should send empty config if fetching config fails', () => {
                vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ status: 'success' })))

                const url = `${DATA_ENDPOINT}/api/v1/analytics`
                expect(() => CrashReporter.uploadCrashReport('some exception', 'some stack')).not.toThrow()
                expect(fetch).toHaveBeenCalledWith(url, expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('"config":{}}')
                }))
            })

            it('should not raise error if request fails', () => {
                vi.mocked(fetch).mockReturnValueOnce(Promise.resolve(Response.json({ status: 'failed' })))

                expect(() => CrashReporter.uploadCrashReport('some exception', 'some stack')).not.toThrow()
                expect(vi.mocked(fetch).mock.calls[0][1]?.method).toEqual('POST')
            })
        })
    })

    describe('filterPII', () => {
        it('should delete user key from L1', () => {
            const userConfig = {
                'framework': 'some framework',
                'user': 'some user',
                'key': 'key',
                'some_other_keys': 'value',
                capabilities: {},
                services: []
            }
            const filteredConfig = CrashReporter.filterPII(userConfig)
            expect(filteredConfig).toEqual({
                'framework': 'some framework',
                'some_other_keys': 'value',
                capabilities: {},
                services: []
            })
        })

        it('should delete user key from testReportingOptions and legacy testObservabilityOptions', () => {
            const userConfig = {
                'framework': 'some framework',
                'user': 'some user',
                'key': 'key',
                capabilities: {},
                services: [
                    ['browserstack', {
                        testObservabilityOptions: {
                            user: 'username',
                            key: 'access-key',
                        },
                        testReportingOptions: {
                            user: 'username',
                            key: 'access-key',
                        },
                    }]
                ]
            }

            // @ts-ignore
            const filteredConfig = CrashReporter.filterPII(userConfig)
            expect(filteredConfig).toEqual({
                'framework': 'some framework',
                capabilities: {},
                services: [
                    ['browserstack', {
                        testObservabilityOptions: {
                        },
                        testReportingOptions: {
                        },
                    }]
                ]
            })
        })

        it('should delete user key from legacy testObservabilityOptions only', () => {
            const userConfig = {
                'framework': 'some framework',
                'user': 'some user',
                'key': 'key',
                capabilities: {},
                services: [
                    ['browserstack', {
                        testObservabilityOptions: {
                            user: 'username',
                            key: 'access-key',
                        },
                    }]
                ]
            }

            // @ts-ignore
            const filteredConfig = CrashReporter.filterPII(userConfig)
            expect(filteredConfig).toEqual({
                'framework': 'some framework',
                capabilities: {},
                services: [
                    ['browserstack', {
                        testObservabilityOptions: {
                        },
                    }]
                ]
            })
        })

        it('should delete user key from browserstack service options', () => {
            const userConfig = {
                'framework': 'some framework',
                'user': 'some user',
                'key': 'key',
                capabilities: {},
                services: [
                    ['browserstack', {
                        user: 'username',
                        key: 'access-key',
                    }]
                ]
            }

            const filteredConfig = CrashReporter.filterPII(userConfig as any)
            expect(filteredConfig).toEqual({
                'framework': 'some framework',
                capabilities: {},
                services: [
                    ['browserstack', {}]
                ]
            })
        })
    })
})
