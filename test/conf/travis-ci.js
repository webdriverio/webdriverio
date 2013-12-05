module.exports = {
    "testPage": {
        "url": 'http://127.0.0.1:8080/site/index.html',
        "url2": 'http://127.0.0.1:8080/site/two.html',
    },
    "host": "localhost",
    "port": 4445,
    "desiredCapabilities" : {
        "browserName": "chrome",
        "version": "31",
        "tunnel-identifier": process.env.TRAVIS_JOB_NUMBER,
        "tags": ["webdriverjs","api","test"],
        "name": "webdriverjs API test",
        "build": process.env.TRAVIS_BUILD_NUMBER,
        "username": process.env.SAUCE_USERNAME,
        "accessKey": process.env.SAUCE_ACCESS_KEY
    }
}