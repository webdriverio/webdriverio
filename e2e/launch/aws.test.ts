import { test, expect } from 'vitest'
import { remote } from 'webdriverio'
import AWS from '@aws-sdk/client-device-farm'

let browser: WebdriverIO.Browser | undefined

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Please provide AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your environment')
}

const projectArn = process.env.AWS_DEVICE_FARM_ARN
if (!projectArn) {
    throw new Error('Please provide AWS_DEVICE_FARM_ARN in your environment')
}

test('allow to attach to an existing session', async () => {
    return
    const devicefarm = new AWS.DeviceFarm({ region: 'us-west-2' })
    const testGridUrlResult = await devicefarm.createTestGridUrl({
        projectArn,
        expiresInSeconds: 600
    })

    if (!testGridUrlResult.url) {
        throw new Error('Could not create a test grid url')
    }

    const url = new URL(testGridUrlResult.url)
    browser = await remote({
        logLevel: 'trace',
        hostname: url.host,
        path: url.pathname,
        protocol: 'https',
        port: 443,
        connectionRetryTimeout: 180000,
        capabilities: {
            browserName: 'chrome',
        }
    })

    await browser.url('http://guinea-pig.webdriver.io/')

    const title = await browser.getTitle()
    expect(title).toBe('WebdriverJS Testpage')

    await browser.deleteSession()
})
