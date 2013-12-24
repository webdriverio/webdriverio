module.exports = {
    "testPage": {
        "url": 'http://127.0.0.1:8080/test/site/index.html',
        "url2": 'http://127.0.0.1:8080/test/site/two.html',
    },
    "host": "ondemand.saucelabs.com",
    "port": 80,
    "logLevel": "silent",
    "desiredCapabilities" : {
        "browserName": process.env._BROWSER.replace(/_/g,' '),
        "platform": process.env._PLATFORM.replace(/_/g,' '),
        "version": process.env._VERSION,
        "device-orientation": process.env._DEVICEORIENTATION || "",
        "device-type": process.env._DEVICETYPE || "",
        "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
        "tags": ["webdriverjs","api","test"],
        "name": "webdriverjs API test",
        "build": process.env.TRAVIS_BUILD_NUMBER,
        "username": process.env.SAUCE_USERNAME,
        "accessKey": process.env.SAUCE_ACCESS_KEY
    }
};