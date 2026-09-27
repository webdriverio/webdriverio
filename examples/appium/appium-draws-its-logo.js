import { draw, circlePoints, arcPoints, innerArcPoints } from './helpers/drawHelper.js'
import { remote } from 'webdriverio'

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
    await driver.$('//UIAApplication[1]/UIAWindow[1]/UIAScrollView[1]/UIAWebView[1]/UIALink[1]').click()
    await draw(driver, [{ x: 200, y: 50 }, { x: 200, y: 250 }])
    await draw(driver, [{ x: 100, y: 150 }, { x: 300, y: 150 }])
    await draw(driver, circlePoints(200, 150))
    await draw(
        driver,
        arcPoints(0,                   2 * Math.PI / 3 * 1),
        arcPoints(2 * Math.PI / 3 * 1, 2 * Math.PI / 3 * 2),
        arcPoints(2 * Math.PI / 3 * 2, 2 * Math.PI / 3 * 3)
    )
    await draw(
        driver,
        innerArcPoints(2 * Math.PI / 3 * 1 + Math.PI / 3, 2 * Math.PI / 3 * 1 + Math.PI + Math.PI / 8 + Math.PI / 3),
        innerArcPoints(2 * Math.PI / 3 * 2 + Math.PI / 3, 2 * Math.PI / 3 * 2 + Math.PI + Math.PI / 8 + Math.PI / 3),
        innerArcPoints(2 * Math.PI / 3 * 3 + Math.PI / 3, 2 * Math.PI / 3 * 3 + Math.PI + Math.PI / 8 + Math.PI / 3)
    )
    await driver.deleteSession()
})().catch(

    console.error
)
