var webdriverjs = require('../../../index.js'),
    merge = require('deepmerge'),
    conf = require('../../conf/index.js');

describe('singleton option', function() {

    var c1, c2;

    before(function(done) {

        c1 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        c2 = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        c1.init(done);
    });

    it('creates only one instance', function() {
        assert.deepEqual(c1, c2);
    });

    it('should have the same sessionID', function() {
        assert.strictEqual(c1.requestHandler.sessionID, c2.requestHandler.sessionID);
    });

    it('should end other reference probably', function(done) {

        // end session of one reference
        c1.end(function(err) {
            assert.ifError(err);
            assert.equal(c1.requestHandler.sessionID, null);

            // check if other reference has no session anymore
            c2.session(function(err, res) {
                assert.ifError(err);
                assert.ifError(res);

                done();
            });

        });

    });

});