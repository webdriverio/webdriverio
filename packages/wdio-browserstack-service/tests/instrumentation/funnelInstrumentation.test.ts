import * as FunnelTestEvent from '../../src/instrumentation/funnelInstrumentation.js'
import { sendFinish, sendStart } from '../../src/instrumentation/funnelInstrumentation.js'
import { BStackLogger } from '../../src/bstackLogger.js'
import fs from 'node:fs'
import got from 'got'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { FUNNEL_INSTRUMENTATION_URL } from '../../src/constants.js'

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
    userName: config.userName,
    accessKey: config.accessKey,
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
    let originalCwd

    beforeEach(() => {
        originalCwd = process.cwd
        process.cwd = () => '/path/to/project'
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
            await FunnelTestEvent.sendStart('SDKTestAttempted', config)

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
        const data = { key: 'value', userName: 'some_name', accessKey: 'some_key' }
        await FunnelTestEvent.fireFunnelRequest(data)
        expect(got.post).toHaveBeenCalledWith(FUNNEL_INSTRUMENTATION_URL, expect.objectContaining({
            headers: expect.any(Object),
            username: data.userName,
            password: data.accessKey,
            json: data
        }))
    })
})
