module.exports = {
    desiredCapabilities: {
        browserName: process.env._BROWSER || '',
        platformName: (process.env._PLATFORM || '').replace(/_/g,' '),
        platformVersion: (process.env._VERSION || ''),
        'appium-version': '1.0',
        deviceName: (process.env._DEVICENAME || '').replace(/_/g,' ')
    }
};