var merge = require('deepmerge');
var conf = require('../../conf/index.js');
var WebdriverIO = require('../../../index.js');
var nock = require('nock');
var sinon = require('sinon');
var fs = require('fs');

var FAKE_SESSION_RESPONSE = {
    sessionId: '31571f3a-4824-4378-b352-65de24952903',
    status: 0
};

var FAKE_SUCCESS_RESPONSE = {
    status: 0,
    value: 'ok'
};

describe('saving screenshot on error', function() {

    var client;

    beforeEach(function() {
        var localConf = merge({}, conf);
        localConf.screenshotPath = 'some_directory';
        localConf.connectionRetryCount = 1;
        client = WebdriverIO.remote(localConf);

        // for screenshot
        sinon.stub(fs, 'existsSync').returns(true);
        sinon.stub(fs, 'writeFile').yields(true);
    });

    afterEach(function() {
        fs.existsSync.restore();
        fs.writeFile.restore();
        nock.cleanAll();
    });

    it('should save screenshot before session end', function(done) {

        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .reply(200, FAKE_SESSION_RESPONSE)
            .post('/wd/hub/session/31571f3a-4824-4378-b352-65de24952903/element')
                .replyWithError('some error')
            .get('/wd/hub/session/31571f3a-4824-4378-b352-65de24952903/screenshot')
                .delayConnection(200)
                .reply(200, FAKE_SUCCESS_RESPONSE);

        // finally call — client.end
        var spy = sinon.spy();
        client.init().click('#notExists').finally(spy);

        setTimeout(function() {
            expect(fs.writeFile.calledOnce).to.be.true;
            expect(fs.writeFile.calledBefore(spy)).to.be.true;
            done();
        }, 300);
    });

    it('should not be the cause of recursion', function(done) {

        var spy = sinon.stub().returns('some error');

        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .reply(200, FAKE_SESSION_RESPONSE)
            .post('/wd/hub/session/31571f3a-4824-4378-b352-65de24952903/element')
                .replyWithError('some error')
            .get('/wd/hub/session/31571f3a-4824-4378-b352-65de24952903/screenshot')
                .times(Infinity)
                .reply(500, spy);

        client.init().click('#notExists');

        setTimeout(function() {
            expect(fs.writeFile.called).to.be.false;
            expect(spy.calledOnce).to.be.true;
            done();
        }, 100);
    });

});