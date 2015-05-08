describe('waitFor',function() {

    var duration = 3500;
    var checkTime = function() {
        return function(res) {
            res.should.be.true;
        };
    };

    describe('(traditional selenium)', function() {

        before(h.setup());

        it('should at least wait until duration has expired', function() {
            var startTime = Date.now();
            return this.client.waitFor('#notExisting', 500).finally(function() {
                var delta = Date.now() - startTime;
                assert(delta > 499);
            });
        });

        it('should return without error after element appears in time',function() {
            return this.client.waitFor('.lateElem', 5000);
        });

    });

    describe('Checked', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was checked', function() {
            var currentTime = Date.now();
            return this.client.waitForChecked('//html/body/section/input[6]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element was unchecked', function() {
            var currentTime = Date.now();
            return this.client.waitForChecked('.radio_waitForSelectedReverse', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Enabled', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was enabled', function() {
            var currentTime = Date.now();
            return this.client.waitForEnabled('//html/body/section/input[8]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element was disabled', function() {
            var currentTime = Date.now();
            return this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Exist', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was appended to the DOM', function() {
            var currentTime = Date.now();
            return this.client.waitForExist('//div[text()="Sorry, I\'m late!"]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element was removed from the DOM', function() {
            var currentTime = Date.now();
            return this.client.waitForExist('.goAway', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Selected', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was selected', function() {
            var currentTime = Date.now();
            return this.client.waitForSelected('//*[@id="selectbox"]/option[3]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element was unselected', function() {
            var currentTime = Date.now();
            return this.client.waitForSelected('.option2', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Text', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a text/content', function() {
            var currentTime = Date.now();
            return this.client.waitForText('//*[contains(@class, "sometextlater")]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after text/content element was removed', function() {
            var currentTime = Date.now();
            return this.client.waitForText('.sometext', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Value', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a value', function() {
            var currentTime = Date.now();
            return this.client.waitForEnabled('.waitForValueEnabled', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element lost its value', function() {
            var currentTime = Date.now();
            return this.client.waitForEnabled('//*[contains(@class, "waitForValueEnabledReverse")]', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Visible', function() {

        beforeEach(h.setup());

        it('should return w/o err after element moved into document bounderies', function() {
            var currentTime = Date.now();
            return this.client.waitForVisible('//*[contains(@class, "notInViewport")]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element left document bounderies', function() {
            var currentTime = Date.now();
            return this.client.waitForVisible('.onMyWay', duration, true).then(checkTime(currentTime));
        });

        it('should return w/o err after parent element moved into document bounderies', function() {
            var currentTime = Date.now();
            return this.client.waitForVisible('//*[contains(@class, "visibletestInner")]', duration).then(checkTime(currentTime));
        });

    });

    describe('timeout', function() {

        before(h.setup());

        it('should use specified timeout', function() {
            var startTime = Date.now();
            return this.client.waitForExist('#notExisting').catch(function() {
                var delta = Date.now() - startTime;
                delta.should.be.above(1000);
            });
        });

        it('should use parameter timeout and should overwrite default value', function() {
            var startTime = Date.now();
            return this.client.waitForExist('#notExisting', 2000).catch(function() {
                var delta = Date.now() - startTime;
                delta.should.be.above(2000);
            });
        });

    });

});
