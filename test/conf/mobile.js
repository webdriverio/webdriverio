export default {
    port: process.env.CI ? 4445 : 4723,
    logLevel: 'verbose',
    desiredCapabilities: {
        app: process.env._APP,
        appPackage: 'io.webdriver.guineapig',
        appActivity: '.MainActivity',
        platformName: (process.env._PLATFORM || '').replace(/_/g, ' '),
        platformVersion: (process.env._VERSION || ''),
        deviceName: (process.env._DEVICENAME || '').replace(/_/g, ' '),
        'appium-version': '1.8.0'
    }
}
