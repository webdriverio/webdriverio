import * as FunnelTestEvent from '../../src/instrumentation/funnelInstrumentation.js'
import { sendFinish, sendStart } from '../../src/instrumentation/funnelInstrumentation.js'
import { BStackLogger } from '../../src/bstackLogger.js'
import fs from 'node:fs'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { FUNNEL_INSTRUMENTATION_URL } from '../../src/constants.js'
import type { BrowserstackHealing } from '@browserstack/ai-sdk-node'

vi.mock('fetch')
const mockedFetch = vi.mocked(fetch)

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
        product: expect.arrayContaining(['observability', 'automate', 'percy', 'accessibility']),
        framework: 'framework'
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

            expect(fetch).not.toHaveBeenCalled()
        })

        it('sendStart calls sends request with correct data', async () => {
            await sendStart(config as any)

            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: expect.any(Object),
                body: expect.any(String) // TODO: find a way to match exact
            }))
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
            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: expect.any(Object),
                body: expect.any(String) // TODO: find a way to match exact
            }))
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
        mockedFetch.mockReturnValueOnce(Promise.resolve(Response.json({})))
        await FunnelTestEvent.fireFunnelRequest(data)
        expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
            method: 'POST',
            headers: expect.any(Object),
            body: JSON.stringify(data)
        }))
    })

    // NOT WORKING CODE:

    describe('Healing instrumentation', () => {

        it('should not send instrumentation event in case user receives an upgrade required warning', async () => {
            const authResult = { message: 'Upgrade required' } as BrowserstackHealing.InitErrorResponse
            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)
            expect(fetch).not.toHaveBeenCalled()
        })

        it('should send server error event when isAuthenticated is false and status is 5xx', async () => {
            const authResult = { isAuthenticated: false, status: 500 } as BrowserstackHealing.InitErrorResponse

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.userName}:${config.accessKey}`).toString('base64')}`,
                    'content-type': 'application/json',
                },

                body: expect.stringContaining('SDKTestTcgDownResponse')
            }))
            const [[, { body }]] = (fetch as jest.Mock).mock.calls
            const parsedBody = JSON.parse(body)

            expectedEventData.event_type = 'SDKTestTcgDownResponse'
            expect(parsedBody).toEqual(expect.objectContaining(expectedEventData))
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

            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.userName}:${config.accessKey}`).toString('base64')}`,
                    'content-type': 'application/json',
                },

                body: expect.stringContaining('SDKTestTcgtInitSuccessful')
            }))
            const [[, { body }]] = (fetch as jest.Mock).mock.calls
            const parsedBody = JSON.parse(body)

            expectedEventData.event_type = 'SDKTestTcgtInitSuccessful'
            expect(parsedBody).toEqual(expect.objectContaining(expectedEventData))
        })

        it('should send initialization failed event if status is 4xx', async () => {
            const authResult = {
                isAuthenticated: true,
                status: 400,
                message: 'Request failed with status code 400'
            } as any

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.userName}:${config.accessKey}`).toString('base64')}`,
                    'content-type': 'application/json',
                },

                body: expect.stringContaining('SDKTestInitFailedResponse')
            }))
            const [[, { body }]] = (fetch as jest.Mock).mock.calls
            const parsedBody = JSON.parse(body)

            expectedEventData.event_type = 'SDKTestInitFailedResponse'
            expect(parsedBody).toEqual(expect.objectContaining(expectedEventData))
        })

        it('should send server error event when isAuthenticated is false and status is 5xx', async () => {
            const authResult = { isAuthenticated: true } as any

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, true)

            expect(fetch).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`${config.userName}:${config.accessKey}`).toString('base64')}`,
                    'content-type': 'application/json',
                },
                body: expect.stringContaining('SDKTestInvalidTcgAuthResponseWithUserImpact')
            }))
            const [[, { body }]] = (fetch as jest.Mock).mock.calls
            const parsedBody = JSON.parse(body)

            expectedEventData.event_type = 'SDKTestInvalidTcgAuthResponseWithUserImpact'
            expect(parsedBody).toEqual(expect.objectContaining(expectedEventData))
        })

        it('should not send user impact event if selfHeal is not enabled by user', async () => {
            const authResult = {
                isAuthenticated: true
            } as any

            FunnelTestEvent.handleHealingInstrumentation(authResult, config as any, false)

            expect(fetch).not.toHaveBeenCalled()
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
            expect(fetch).not.toHaveBeenCalled() // Ensure no event is sent
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

            expect(fetch).not.toHaveBeenCalled()
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

            expect(fetch).not.toHaveBeenCalled()
            expect(BStackLogger.warn).toHaveBeenCalledWith('Healing is not enabled for your group, please contact the admin')
        })
    })
})
