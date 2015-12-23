export default {
    port: 4723,
    desiredCapabilities: {
        app: process.env._APP,
        appPackage: 'io.webdriverjs.example',
        appActivity: '.MainActivity',
        browserName: '',
        platformName: (process.env._PLATFORM || '').replace(/_/g, ' '),
        platformVersion: (process.env._VERSION || ''),
        deviceName: (process.env._DEVICENAME || '').replace(/_/g, ' '),
        'appium-version': '1.4.13'
    }
}
