import { circleAction, arcAction, innerArcAction } from './helpers/drawHelper.js'
import { remote } from '../../packages/webdriverio/build/index.js'

/**
 * in order to test this you need to compile the app from the old v4 repository
 * (https://github.com/webdriverio-boneyard/v4/blob/master/package.json#L34)
 */
const webviewApp = '/path/to/app'

;(async () => {
    const driver = await remote({
        port: 4723,
        logLevel: 'debug',
        capabilities: {
            platformName: 'iOS',
            platformVersion: '8.4',
            deviceName: 'iPhone 6',
            app: webviewApp
        }
    })

    await driver.pause(2000)
    await driver.click('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIALink[1]')
    await driver.touchAction([
        { action: 'press', x: 200, y: 50 },
        { action: 'moveTo', x: 0, y: 200 },
        'release'
    ])
    await driver.touchAction([
        { action: 'press', x: 100, y: 150 },
        { action: 'moveTo', x: 200, y: 0 },
        'release'
    ])
    await driver.touchAction(circleAction(200, 150))
    await driver.touchAction([
        arcAction(0,                   2 * Math.PI / 3 * 1),
        arcAction(2 * Math.PI / 3 * 1, 2 * Math.PI / 3 * 2),
        arcAction(2 * Math.PI / 3 * 2, 2 * Math.PI / 3 * 3)
    ])
    await driver.touchAction([
        innerArcAction(2 * Math.PI / 3 * 1 + Math.PI / 3, 2 * Math.PI / 3 * 1 + Math.PI + Math.PI / 8 + Math.PI / 3),
        innerArcAction(2 * Math.PI / 3 * 2 + Math.PI / 3, 2 * Math.PI / 3 * 2 + Math.PI + Math.PI / 8 + Math.PI / 3),
        innerArcAction(2 * Math.PI / 3 * 3 + Math.PI / 3, 2 * Math.PI / 3 * 3 + Math.PI + Math.PI / 8 + Math.PI / 3)
    ])
    await driver.deleteSession()
})().catch(
    // eslint-disable-next-line no-console
    console.error
)
