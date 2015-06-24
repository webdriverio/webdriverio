describe('waitFor',function() {

    var duration = 3500;
    var checkTime = function(before) {
        return function(res) {
            var after = new Date().getTime(),
                time = after - before;
            res.should.be.true;
            time.should.be.within(1900, 3000);
        };
    };

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
            return this.client.waitForValue('//*[contains(@class, "waitForValueEnabledReverse")]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element lost its value', function() {
            var currentTime = Date.now();
            return this.client.waitForValue('.waitForValueEnabled', duration, true).then(checkTime(currentTime));
        });

    });

    describe('Visible', function() {

        beforeEach(h.setup());

        it('should return w/o err after element moved into document bounderies', function() {
            var currentTime = Date.now();
            return this.client.waitForVisible('//*[contains(@class, "notVisible")]', duration).then(checkTime(currentTime));
        });

        it('(reverse) should return w/o err after element left document bounderies', function() {
            var currentTime = Date.now();
            return this.client.waitForVisible('.onMyWay', duration, true).then(checkTime(currentTime));
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

    describe('waituntil', function() {

        beforeEach(h.setup());

        it('should wait on an alert', function() {

            return this.client.execute(function() {
                setTimeout(function() {
                    alert('Whaaat up');
                }, 1000);
            }).waitUntil(function() {
                return this.alertText().then(function(text) {
                    return text;
                }, function() {
                    return false;
                });
            }, 2000).then(function(alertText) {
                alertText.should.be.equal('Whaaat up');
            });

        });

    });

});
