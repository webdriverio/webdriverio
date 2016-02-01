export default {
    port: process.env.CI ? 4445 : 4723,
    desiredCapabilities: {
        app: process.env._APP,
        appPackage: 'io.webdriverjs.example',
        appActivity: '.MainActivity',
        platformName: (process.env._PLATFORM || '').replace(/_/g, ' '),
        platformVersion: (process.env._VERSION || ''),
        deviceName: (process.env._DEVICENAME || '').replace(/_/g, ' '),
        'appium-version': '1.4.16'
    }
}
