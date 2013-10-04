var Mocha = require('mocha');
require('./bootstrap.js');

var mocha = new Mocha({
    reporter: 'spec',
    timeout: 10000
});

findSpecs().forEach(mocha.addFile.bind(mocha));
var runner = mocha.run(process.exit);

runner.suite.beforeAll(initBrowser);
runner.suite.afterAll(stopBrowser);

function findSpecs() {
  var glob = require('glob');
  return glob.sync(__dirname + '/spec/*.js');
}

function initBrowser(done) {
    var webdriverjs = require('../index.js');
    this.browser = webdriverjs.remote(conf);
    this.browser
        .init()
        .url(conf.testPage.url, done);
}

function stopBrowser(done) {
    this.browser.end(done);
}