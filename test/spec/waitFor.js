describe('waitFor',function() {

    var duration = 10000;
    var checkTime = function(res) {
        res.should.be.true;
    };

    describe('Enabled', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was enabled', function() {
            return this.client.waitForEnabled('//html/body/section/input[8]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element was disabled', function() {
            return this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true).then(checkTime);
        });

    });

    describe('Exist', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was appended to the DOM', function() {
            return this.client.waitForExist('//div[text()="Sorry, I\'m late!"]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element was removed from the DOM', function() {
            return this.client.waitForExist('.goAway', duration, true).then(checkTime);
        });

    });

    describe('Selected', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was selected', function() {
            return this.client.waitForSelected('//*[@id="selectbox"]/option[3]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element was unselected', function() {
            return this.client.waitForSelected('.option2', duration, true).then(checkTime);
        });

    });

    describe('Text', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a text/content', function() {
            return this.client.waitForText('//*[contains(@class, "sometextlater")]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after text/content element was removed', function() {
            return this.client.waitForText('.sometext', duration, true).then(checkTime);
        });

    });

    describe('Value', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a value', function() {
            return this.client.waitForValue('//*[contains(@class, "waitForValueEnabledReverse")]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element lost its value', function() {
            return this.client.waitForValue('.waitForValueEnabled', duration, true).then(checkTime);
        });

    });

    describe('Visible', function() {

        beforeEach(h.setup());

        it('should return w/o err after element moved into document bounderies', function() {
            return this.client.waitForVisible('//*[contains(@class, "notVisible")]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element left document bounderies', function() {
            return this.client.waitForVisible('.onMyWay', duration, true).then(checkTime);
        });

    });

    describe('timeout', function() {

        before(h.setup());

        it('should use specified timeout', function (done) {
            var startTime = Date.now();
            return this.client.waitForExist('#notExisting').then(
                function () {
                    done(new Error('waitForExist promise should be rejected'));
                }, function () {
                    var delta = Date.now() - startTime;
                    delta.should.be.above(1000);
                    done();
                });
        });

        it('should use parameter timeout and should overwrite default value', function (done) {
            var startTime = Date.now();
            this.client.waitForExist('#notExisting', 2000).then(
                function () {
                    done(new Error('waitForExist promise should be rejected'));
                },
                function () {
                    var delta = Date.now() - startTime;
                    delta.should.be.above(2000);
                    done();
                });
        });

    });

});
