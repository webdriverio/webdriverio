describe('specific mobile command tests', function() {

    before(h.setup);
    beforeEach(openGestureTestPage);

    // not implemented in appium
    it.skip('[not implemented in appium] should execute touch command', function(done) {

        this.client
            .getAttribute('//*[@id="log-gesture-touch"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .touch('//*[@id="hitarea"]', h.noError)
            .getAttribute('//*[@id="log-gesture-touch"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    // not implemented in appium
    it.skip('[not implemented in appium] should execute release command', function(done) {

        this.client
            .getAttribute('//*[@id="log-gesture-release"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .release('//*[@id="hitarea"]', h.noError)
            .getAttribute('//*[@id="log-gesture-release"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    // not implemented in appium
    it.skip('[not implemented in appium] should execute hold command', function(done) {

        this.client
            .getAttribute('//*[@id="log-gesture-hold"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .hold('//*[@id="hitarea"]', h.noError)
            .getAttribute('//*[@id="log-gesture-hold"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    // not working anymore - need for improvements
    it.skip('should execute tap command', function(done) {

        // TODO why we can't call this.client in callbacks
        var self = this;

        this.client
            .getAttribute('//*[@id="log-gesture-tap"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .getLocation('//*[@id="log-gesture-tap"]', function(err,res) {
                self.client
                    .tap(null, res.x, res.y, h.noError);
            })
            .getAttribute('//*[@id="log-gesture-tap"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    // TODO figure out why toubletap is not working with tapCount 2
    it.skip('[TODO] should execute doubletap command', function(done) {

        // TODO why we can't call this.client in callbacks
        var self = this;

        this.client
            .getAttribute('//*[@id="log-gesture-doubletap"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .getLocation('//*[@id="log-gesture-tap"]', function(err,res) {
                self.client.tap(null, res.x, res.y, 2.0, 2.0, h.noError);
            })
            .getAttribute('//*[@id="log-gesture-doubletap"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    it('should execute dragRight command', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragright"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .dragRight('//*[@id="hitarea"]',h.noError)
            .getAttribute('//*[@id="log-gesture-dragright"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    it('should execute dragLeft command', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragleft"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .dragLeft('//*[@id="hitarea"]',h.noError)
            .getAttribute('//*[@id="log-gesture-dragleft"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    it('should execute dragUp command', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragup"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .dragUp('//*[@id="hitarea"]',h.noError)
            .getAttribute('//*[@id="log-gesture-dragup"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    it('should execute dragDown command', function(done) {
        this.client
            .getAttribute('//*[@id="log-gesture-dragdown"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, '');
            })
            .dragDown('//*[@id="hitarea"]',h.noError)
            .getAttribute('//*[@id="log-gesture-dragdown"]','class',function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'active');
            })
            .call(done);
    });

    it('should get current orientation', function(done) {

        this.client
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'PORTRAIT');
            })
            .setOrientation('landscape', h.noError)
            .getOrientation(function(err,res) {
                assert.equal(null, err);
                assert.equal(res, 'LANDSCAPE');
            })
            .setOrientation('portrait', h.noError)
            .call(done);

    });

    function openGestureTestPage(done) {
        this.client.url(conf.testPage.gestureTest).call(done);
    }

});