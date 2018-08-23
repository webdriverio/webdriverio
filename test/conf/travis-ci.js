export default {
    port: 4445,
    logLevel: 'command',
    waitforTimeout: 1000,
    connectionRetryTimeout: 1800000, // 30 min
    desiredCapabilities: {
        browserName: (process.env._BROWSER || '').replace(/_/g, ' '),
        platform: (process.env._PLATFORM || '').replace(/_/g, ' '),
        version: process.env._VERSION,
        screenResolution: process.env._BROWSER === 'safari' ? '1280x960' : '1280x1024',
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
        'idle-timeout': 900,
        tags: [
            'webdriverio',
            process.env._ENV || 'desktop',
            process.env._BROWSER || process.env._DEVICENAME || 'unknown_device',
            process.env._PLATFORM || 'unknown_platform',
            process.env._VERSION || 'unknown_version'
        ],
        name: 'webdriverio test',
        build: process.env.TRAVIS_BUILD_NUMBER,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY
    }
}
