import FunnelTestEvent from '../../src/instrumentation/funnelInstrumentation.js'
import { BStackLogger } from '../../src/bstackLogger.js'
import fs from 'node:fs'
import got from 'got'
import UsageStats from '../../src/testOps/usageStats.js'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

vi.mock('got', () => ({
    default: {
        post: vi.fn()
    }
}))

// const mockedGot = vi.mocked(got)
describe('FunnelTestEvent', () => {
    let originalCwd

    beforeEach(() => {
        originalCwd = process.cwd
        process.cwd = () => '/path/to/project'
    })

    afterEach(() => {
        process.cwd = originalCwd
        vi.restoreAllMocks()
        vi.resetAllMocks()
    })

    it('fireFunnelTestEvent does nothing if userName or accessKey is missing in config', async () => {
        const config = { userName: '', accessKey: '' }
        await FunnelTestEvent.fireFunnelTestEvent('SDKTestAttempted', config)

        expect(got.post).not.toHaveBeenCalled()
    })

    it('sendStart calls fireFunnelTestEvent with correct eventType', async () => {
        const config = { userName: 'username', accessKey: 'accesskey' }
        FunnelTestEvent.fireFunnelTestEvent = vi.fn()

        await FunnelTestEvent.sendStart(config)

        expect(FunnelTestEvent.fireFunnelTestEvent).toHaveBeenCalledWith('SDKTestAttempted', config)
    })

    it('sendFinish calls fireFunnelTestEvent with correct eventType', async () => {
        const config = { userName: 'username', accessKey: 'accesskey' }
        FunnelTestEvent.fireFunnelTestEvent = vi.fn()

        await FunnelTestEvent.sendFinish(config)

        expect(FunnelTestEvent.fireFunnelTestEvent).toHaveBeenCalledWith('SDKTestSuccessful', config)
    })

    it('saveFunnelData writes data to file and returns file path', () => {
        const config = { userName: 'username', accessKey: 'accesskey' }
        const eventData = { event: 'data' }
        // FunnelTestEvent.buildEventData = vi.fn(() => eventData);
        vi.spyOn(FunnelTestEvent, 'buildEventData').mockReturnValueOnce(eventData)
        BStackLogger.ensureLogsFolder = vi.fn()
        vi.spyOn(fs, 'writeFileSync').mockImplementationOnce(() => {})

        FunnelTestEvent.saveFunnelData('SDKTestSuccessful', config)

        expect(fs.writeFileSync).toHaveBeenCalledWith(expect.any(String), JSON.stringify(eventData))
    })

    it('fireRequest sends request with correct data', async () => {
        const data = { key: 'value' }
        await FunnelTestEvent.fireRequest(data)
        expect(got.post).toHaveBeenCalled()
    })

    it('getProductList returns list of products based on config', () => {
        const config = {
            testObservability: { enabled: true },
            accessibility: true,
            percy: false,
            automate: true,
            appAutomate: false
        }

        const productList = FunnelTestEvent.getProductList(config)

        expect(productList).toEqual(['observability', 'accessibility', 'automate'])
    })

    it('getProductMap returns map of products based on config', () => {
        const config = {
            testObservability: { enabled: true },
            accessibility: true,
            percy: false,
            automate: true,
            appAutomate: false
        }

        const productMap = FunnelTestEvent.getProductMap(config)

        expect(productMap).toEqual({
            'observability': true,
            'accessibility': true,
            'percy': false,
            'automate': true,
            'app_automate': false
        })
    })

    it('getProductUsage returns formatted product usage based on workersData', () => {
        const workersData = [
            { id: 1, name: 'worker1' },
            { id: 2, name: 'worker2' }
        ]
        UsageStats.getInstance().getFormattedData = vi.fn(() => 'formattedData')

        const productUsage = FunnelTestEvent.getProductUsage(workersData)

        expect(productUsage).toEqual({
            testObservability: 'formattedData'
        })
    })

    it('getLanguageFramework returns formatted language framework', () => {
        const framework = 'WebdriverIO'

        const languageFramework = FunnelTestEvent.getLanguageFramework(framework)

        expect(languageFramework).toBe('WebdriverIO_WebdriverIO')
    })

    it('getReferrer returns formatted referrer', () => {
        const framework = 'WebdriverIO'

        const referrer = FunnelTestEvent.getReferrer(framework)

        expect(referrer).toContain('WebdriverIO-'+framework)
    })

    it('buildEventData returns correct event data based on eventType and config', () => {
        const eventType = 'SDKTestSuccessful'
        const config = {
            userName: 'username',
            accessKey: 'accesskey',
            framework: 'mocha',
            buildName: 'test-build',
            buildIdentifier: 12345,
            testObservability: { enabled: true },
            accessibility: true,
            percy: false,
            automate: true,
            appAutomate: false
        }
        const expectedEventData = {
            userName: 'username',
            accessKey: 'accesskey',
            event_type: 'SDKTestSuccessful',
            detectedFramework: 'WebdriverIO-mocha',
            event_properties: {
                language_framework: 'WebdriverIO_mocha',
                referrer: expect.stringContaining('WebdriverIO-'),
                language: 'WebdriverIO',
                languageVersion: process.version,
                buildName: 'test-build',
                buildIdentifier: '12345',
                os: expect.any(String),
                hostname: expect.any(String),
                productMap: {
                    'observability': true,
                    'accessibility': true,
                    'percy': false,
                    'automate': true,
                    'app_automate': false
                },
                product: ['observability', 'accessibility', 'automate'],
                productUsage: expect.anything()
            }
        }

        console.log(FunnelTestEvent)

        const eventData = FunnelTestEvent.buildEventData(eventType, config)

        expect(eventData).toEqual(expectedEventData)
    })
})
