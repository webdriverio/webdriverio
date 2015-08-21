module.exports = {
    desiredCapabilities: {
        browserName: process.env._BROWSER || '',
        platformName: (process.env._PLATFORMNAME || '').replace(/_/g,' '),
        platformVersion: (process.env._PLATFORMVERSION || ''),
        'appium-version': (process.env._APPIUMVERSION || '1.3.4'),
        deviceName: (process.env._DEVICENAME || '').replace(/_/g,' ')
    }
};