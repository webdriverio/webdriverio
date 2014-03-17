describe('RequestHandler', function() {
    var RH = require('../../lib/utils/RequestHandler.js'),
        nock = require('nock'),
        noOps = function(){};

    it('gives a session', function(done) {
        nock('http://127.0.0.1:4444')
            .post('/wd/hub/session', {"desiredCapabilities":{"browserName":"chrome"}})
            .reply(200, "{\"status\":0,\"sessionId\":\"6656c65b-a84b-4919-870e-ce9d725f3170\",\"value\":{\"platform\":\"LINUX\",\"acceptSslCerts\":true,\"javascriptEnabled\":true,\"browserName\":\"chrome\",\"chrome\":{\"userDataDir\":\"/tmp/.org.chromium.Chromium.DHRpAQ\"},\"rotatable\":false,\"locationContextEnabled\":true,\"webdriver.remote.sessionid\":\"6656c65b-a84b-4919-870e-ce9d725f3170\",\"version\":\"32.0.1700.77\",\"takesHeapSnapshot\":true,\"cssSelectorsEnabled\":true,\"databaseEnabled\":false,\"handlesAlerts\":true,\"browserConnectionEnabled\":false,\"nativeEvents\":true,\"webStorageEnabled\":true,\"applicationCacheEnabled\":false,\"takesScreenshot\":true},\"state\":null,\"class\":\"org.openqa.selenium.remote.Response\",\"hCode\":1376091878}", { date: 'Mon, 20 Jan 2014 22:35:27 GMT',
            server: 'Jetty/5.1.x (Linux/3.12.7-2-ARCH amd64 java/1.7.0_51',
            expires: 'Thu, 01 Jan 1970 00:00:00 GMT',
            'cache-control': 'no-cache',
            'content-type': 'application/json;charset=UTF-8',
            'content-length': '673' });

        var options = {
            eventHandler: { emit: noOps },
            options: {},
            logger: { log: noOps }
        }

        var rh = new RH(options);
        rh.create('/session', {
            desiredCapabilities: {
                browserName: 'chrome'
            }
        }, function(err, res) {
            assert.equal(null, err);
            assert.equal(res.sessionId, '6656c65b-a84b-4919-870e-ce9d725f3170');
            assert.equal(rh.sessionID, '6656c65b-a84b-4919-870e-ce9d725f3170');
            done();
        });
    });
});