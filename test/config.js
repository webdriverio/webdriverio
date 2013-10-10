module.exports = {
    testpageURL: 'http://webdriverjs.christian-bromann.com',
    testpageTitle: 'WebdriverJS Testpage',
    env: {
        travis: {
            options: {
                host: 'ondemand.saucelabs.com',
                port: 80,
                logLevel: 'silent'
            },
            defaultCapabilities : {
                build: process.env.TRAVIS_BUILD_NUMBER ? 'build' + process.env.TRAVIS_BUILD_NUMBER : Date.now(),
                username: process.env.SAUCE_USERNAME,
                accessKey: process.env.SAUCE_ACCESS_KEY,
                'record-video': false,
                'record-screenshots': false
            },
            capabilties: [
                {
                    browserName: 'chrome',
                    version: '27',
                    platform: 'XP',
                    tags: ['webdriverjs','api','test','chrome','v27','XP'],
                    name: 'webdriverjs API test',
                }, {
                    browserName: 'firefox',
                    version: '25',
                    platform: 'Windows 8',
                    tags: ['webdriverjs','api','test','firefox','v25','Win8'],
                    name: 'webdriverjs API test',
                }, {
                    browserName: 'safari',
                    version: '6',
                    platform: 'OS X 10.8',
                    tags: ['webdriverjs','api','test','safari','v6','OS X 10.8'],
                    name: 'webdriverjs API test',
                }, {
                    browserName: 'android',
                    version: '4.0',
                    platform: 'Linux',
                    tags: ['webdriverjs','api','test','android','Linux','v4.0','Linux'],
                    name: 'webdriverjs API test',
                    'device-type': 'tablet',
                    'device-orientation': 'portrait'
                }
            ],
            requestOptions: {
                headers: { 'Content-Type': 'text/json' },
                url: 'http://' + process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY + '@saucelabs.com/rest/v1/' + process.env.SAUCE_USERNAME + '/jobs/',
                method: 'PUT',
                body: JSON.stringify({
                    passed: true,
                    public: true
                })
            }
        },
        local: {
            options: {
                logLevel: 'silent'
            },
            defaultCapabilities : {},
            capabilties: [
                {
                    browserName: 'chrome'
                }, {
                    browserName: 'firefox'
                }, {
                    browserName: 'phantomjs',
                }
            ]
        }
    }
};