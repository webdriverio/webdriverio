module.exports = {
    testPage: {
        start: 'http://127.0.0.1:8080/test/site/www/index.html',
        subPage: 'http://127.0.0.1:8080/test/site/www/two.html'
    },
    host: 'localhost',
    port: 4444,
    logLevel: 'silent',
    desiredCapabilities: {
        browserName: 'phantomjs'
    }
};