var merge = require('deepmerge');
var nock = require('nock');
var conf = require('../../conf/index.js');
var WebdriverIO = require('../../../index.js');

var FAKE_SUCCESS_RESPONSE = {
    sessionId: '31571f3a-4824-4378-b352-65de24952903',
    status: 0
};

describe('connection retries', function() {
    afterEach(function () {
        nock.cleanAll();
    });

    it('should retry connection 3 times if network error occurs', function () {
        // mock 2 request errors and third successful
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .twice()
                .replyWithError('some error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE);

        return WebdriverIO.remote(conf).init().then(function(res) {
            expect(res).deep.equal(FAKE_SUCCESS_RESPONSE);
        }).catch(function(err) {
            expect(err).to.be.null;
        });
    });

    it('should retry connection 3 times if server response with 500', function () {
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .twice()
                .reply(500, '500 error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE);

        return WebdriverIO.remote(conf).init().then(function(res) {
            expect(res).deep.equal(FAKE_SUCCESS_RESPONSE);
        }).catch(function(err) {
            expect(err).to.be.null;
        });
    });

    it('should fail if all connection attempts failed', function () {
        // mock 3 request errors
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .thrice()
                .replyWithError('some error');

        return WebdriverIO.remote(conf).init().catch(function (err) {
            expect(err).not.to.be.undefined;
            expect(err.message).to.match(/some error/);
        });
    });

    it('should use connectionRetryTimeout option in requests retrying', function () {
        // mock 1 slow request and 1 successful one
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .delayConnection(5000)
                .reply(200, 'some response')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE);

        var start = Date.now();

        var localConf = merge({}, conf);
        localConf.connectionRetryTimeout = 3000;

        return WebdriverIO.remote(localConf).init().then(function () {
            var connectionTime = Date.now() - start;

            expect(connectionTime).to.be.above(3000);
            expect(connectionTime).to.be.below(4000);
        });
    });

    it('should use connectionRetryCount option in requests retrying', function () {
        // mock 12 request errors
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .times(12)
                .replyWithError('some error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE);

        var localConf = merge({}, conf);
        localConf.connectionRetryCount = 15;

        return WebdriverIO.remote(localConf).init();
    });
});