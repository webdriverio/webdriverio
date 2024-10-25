import * as FunnelTestEvent from '../../src/instrumentation/funnelInstrumentation.js'
import { sendFinish, sendStart } from '../../src/instrumentation/funnelInstrumentation.js'
import { BStackLogger } from '../../src/bstackLogger.js'
import fs from 'node:fs'
import got from 'got'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { FUNNEL_INSTRUMENTATION_URL } from '../../src/constants.js'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'

vi.mock('got', () => ({
    default: {
        post: vi.fn()
    }
}))

const config = {
    userName: 'your-username',
    accessKey: 'your-access-key',
    testObservability: { enabled: true },
    framework: 'framework',
    buildName: 'build-name',
    buildIdentifier: 'your-build-identifier',
    accessibility: true,
    percy: true,
    automate: true,
    appAutomate: false,
}

const expectedEventData = {
    userName: '[REDACTED]',
    accessKey: '[REDACTED]',
    event_type: 'SDKTestAttempted',
    detectedFramework: 'WebdriverIO-framework',
    event_properties: {
        language_framework: 'WebdriverIO_framework',
        referrer: expect.stringContaining('WebdriverIO-'),
        language: 'WebdriverIO',
        languageVersion: process.version,
        buildName: config.buildName,
        buildIdentifier: config.buildIdentifier,
        os: expect.any(String),
        hostname: expect.any(String),
        productMap: {
            'observability': true,
            'accessibility': true,
            'percy': true,
            'automate': true,
            'app_automate': false
        },
        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
    }
}

describe('funnelInstrumentation', () => {
    let originalCwd: { (): string; (): string }

    beforeEach(() => {
        originalCwd = process.cwd
        process.cwd = () => '/path/to/project'
        vi.spyOn(BStackLogger, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        process.cwd = originalCwd
        vi.restoreAllMocks()
        vi.resetAllMocks()
        vi.clearAllMocks()
    })

    describe('sendStart', () => {
        it('does nothing if userName or accessKey is missing in config', async () => {
            const config = { userName: '', accessKey: '' }
            await FunnelTestEvent.sendStart(config as any)

            expect(got.post).not.toHaveBeenCalled()
        })

        it('sendStart calls sends request with correct data', async () => {
            await sendStart(config as any)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: expectedEventData }))
        })
    })

    describe('sendFinish', () => {
        it('sendFinish calls sends request with correct data', async () => {
            const finishConfig = {
                ...config,
                'accessibility': false,
                'percy': false,
            }

            const finishExpectedEventData = {
                ...expectedEventData,
                event_type: 'SDKTestSuccessful',
                event_properties: {
                    ...expectedEventData.event_properties,
                    productMap: {
                        'observability': true,
                        'accessibility': false,
                        'percy': false,
                        'automate': true,
                        'app_automate': false
                    },
                    product: expect.arrayContaining(['observability', 'automate']),
                    productUsage: expect.objectContaining({
                        testObservability: expect.any(Object)
                    })
                },
            }

            await sendFinish(finishConfig as any)
            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: finishConfig.userName,
                password: finishConfig.accessKey,
                json: finishExpectedEventData }))
        })
    })

    it('saveFunnelData writes data to file and returns file path', () => {
        BStackLogger.ensureLogsFolder = vi.fn()
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {})
        const filePath = FunnelTestEvent.saveFunnelData('SDKTestSuccessful', config as any)
        expect(fs.writeFileSync).toHaveBeenCalledWith(filePath, expect.any(String))
    })

    it('fireFunnelRequest sends request with correct data', async () => {
        const data = { key: 'value', userName: '[REDACTED]', accessKey: '[REDACTED]' }
        await FunnelTestEvent.fireFunnelRequest(data)
        expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
            headers: expect.any(Object),
            username: data.userName,
            password: data.accessKey,
            json: data
        }))
    })

    describe('Healing instrumentation', () => {

        it('should display upgrade required warning', async () => {
            const authResult = { message: 'Upgrade required' } as BrowserstackHealing.InitErrorResponse
            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)
            expect(got.post).not.toHaveBeenCalled()
        })

        it('should send server error event when isAuthenticated is false and status is 5xx', async () => {
            const authResult = { isAuthenticated: false, status: 500 } as BrowserstackHealing.InitErrorResponse
            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: {
                    userName: '[REDACTED]',
                    accessKey: '[REDACTED]',
                    event_type: 'SDKTestTcgDownResponse',
                    detectedFramework: 'WebdriverIO-framework',
                    event_properties: {
                        language_framework: 'WebdriverIO_framework',
                        referrer: expect.stringContaining('WebdriverIO-'),
                        language: 'WebdriverIO',
                        languageVersion: process.version,
                        buildName: config.buildName,
                        buildIdentifier: config.buildIdentifier,
                        os: expect.any(String),
                        hostname: expect.any(String),
                        productMap: {
                            'observability': true,
                            'accessibility': true,
                            'percy': true,
                            'automate': true,
                            'app_automate': false
                        },
                        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
                    }
                }
            }))
        })

        it('should send authentication failure event when isAuthenticated is false and status is 4xx', async () => {
            const authResult = { isAuthenticated: false, status: 401 } as BrowserstackHealing.InitErrorResponse
            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: {
                    userName: '[REDACTED]',
                    accessKey: '[REDACTED]',
                    event_type: 'SDKTestTcgAuthFailure',
                    detectedFramework: 'WebdriverIO-framework',
                    event_properties: {
                        language_framework: 'WebdriverIO_framework',
                        referrer: expect.stringContaining('WebdriverIO-'),
                        language: 'WebdriverIO',
                        languageVersion: process.version,
                        buildName: config.buildName,
                        buildIdentifier: config.buildIdentifier,
                        os: expect.any(String),
                        hostname: expect.any(String),
                        productMap: {
                            'observability': true,
                            'accessibility': true,
                            'percy': true,
                            'automate': true,
                            'app_automate': false
                        },
                        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
                    }
                }
            }))
        })

        it('should send initialization success event when userId is present', async () => {
            const authResult = {
                isAuthenticated: true,
                userId: 123456,
                groupId: 234567,
                sessionToken: 'session-token',
                isGroupAIEnabled: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: true
            } as BrowserstackHealing.InitSuccessResponse

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: {
                    userName: '[REDACTED]',
                    accessKey: '[REDACTED]',
                    event_type: 'SDKTestTcgtInitSuccessful',
                    detectedFramework: 'WebdriverIO-framework',
                    event_properties: {
                        language_framework: 'WebdriverIO_framework',
                        referrer: expect.stringContaining('WebdriverIO-'),
                        language: 'WebdriverIO',
                        languageVersion: process.version,
                        buildName: config.buildName,
                        buildIdentifier: config.buildIdentifier,
                        os: expect.any(String),
                        hostname: expect.any(String),
                        productMap: {
                            'observability': true,
                            'accessibility': true,
                            'percy': true,
                            'automate': true,
                            'app_automate': false
                        },
                        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
                    }
                }
            }))
        })

        it('should send initialization failed event if status is 4xx', async () => {
            const authResult = {
                isAuthenticated: true,
                status: 400,
                message: 'Request failed with status code 400'
            } as any

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: {
                    userName: '[REDACTED]',
                    accessKey: '[REDACTED]',
                    event_type: 'SDKTestInitFailedResponse',
                    detectedFramework: 'WebdriverIO-framework',
                    event_properties: {
                        language_framework: 'WebdriverIO_framework',
                        referrer: expect.stringContaining('WebdriverIO-'),
                        language: 'WebdriverIO',
                        languageVersion: process.version,
                        buildName: config.buildName,
                        buildIdentifier: config.buildIdentifier,
                        os: expect.any(String),
                        hostname: expect.any(String),
                        productMap: {
                            'observability': true,
                            'accessibility': true,
                            'percy': true,
                            'automate': true,
                            'app_automate': false
                        },
                        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
                    }
                }
            }))
        })

        it('should send invalid TCG auth with user impact event if status is invalid', async () => {
            const authResult = {
                isAuthenticated: true
            } as any

            const bstackConfig = {
                ...config,
                selfHeal: true
            }

            FunnelTestEvent.handleHealingInstrumentation(authResult, bstackConfig as any, true)

            expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                headers: expect.any(Object),
                username: config.userName,
                password: config.accessKey,
                json: {
                    userName: '[REDACTED]',
                    accessKey: '[REDACTED]',
                    event_type: 'SDKTestInvalidTcgAuthResponseWithUserImpact',
                    detectedFramework: 'WebdriverIO-framework',
                    event_properties: {
                        language_framework: 'WebdriverIO_framework',
                        referrer: expect.stringContaining('WebdriverIO-'),
                        language: 'WebdriverIO',
                        languageVersion: process.version,
                        buildName: config.buildName,
                        buildIdentifier: config.buildIdentifier,
                        os: expect.any(String),
                        hostname: expect.any(String),
                        productMap: {
                            'observability': true,
                            'accessibility': true,
                            'percy': true,
                            'automate': true,
                            'app_automate': false
                        },
                        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility'])
                    }
                }
            }))
        })

        it('should not send user impact event if selfHeal is not enabled by user', async () => {
            const authResult = {
                isAuthenticated: true
            } as any

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, false)

            expect(got.post).not.toHaveBeenCalled()
        })

        it('should handle exceptions during healing instrumentation', async () => {
            // Create an authResult that throws an error when 'userId' is accessed
            const authResult = {
                isAuthenticated: true,
                get userId() {
                    throw new Error('Property access error')
                }
            } as any

            const debugSpy = vi.spyOn(BStackLogger, 'debug')

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('Error in handling healing instrumentation:'))
            expect(got.post).not.toHaveBeenCalled() // Ensure no event is sent
        })

        it('should handle healing not enabled for user', async () => {
            const authResult = {
                isAuthenticated: true,
                userId: 123456,
                groupId: 234567,
                sessionToken: 'session-token',
                isGroupAIEnabled: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: false
            } as BrowserstackHealing.InitSuccessResponse

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, false)

            expect(got.post).not.toHaveBeenCalled()
        })

        it('should handle healing disabled for the group', async () => {
            const authResult = {
                isAuthenticated: true,
                userId: 123456,
                groupId: 234567,
                sessionToken: 'session-token',
                isGroupAIEnabled: true,
                defaultLogDataEnabled: true,
                isHealingEnabled: false
            } as BrowserstackHealing.InitSuccessResponse

            const bstackConfig = {
                ...config,
                selfHeal: true
            }

            FunnelTestEvent.handleHealingInstrumentation(authResult, bstackConfig as any, true)

            expect(got.post).not.toHaveBeenCalled()
            expect(BStackLogger.warn).toHaveBeenCalledWith('Healing is not enabled for your group, please contact the admin')
        })
    })
})
