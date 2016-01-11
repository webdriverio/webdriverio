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

        // .waitForValueEnabledReverse is enabled by default and will be disabled after 2 seconds
        it('(reverse) should return w/o err after element was disabled', function() {
            return this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true).then(checkTime);
        });

        // .waitForValueEnabled is disabled by default and will be enabled after 2 seconds
        it('should return with an error if the element never becomes enabled', function() {
            return expect(this.client.waitForEnabled('.waitForValueEnabled', 10))
            .to.be.rejectedWith('element (.waitForValueEnabled) still not enabled after 10ms');
        });

        it('should pass through an error from isEnabled()', function() {
            return expect(this.client.waitForEnabled('#notExisting', duration, true))
            .to.be.rejectedWith("An element could not be located on the page using the given search parameters")
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

        it('should return with an error if the element never exists', function() {
            return expect(this.client.waitForExist('#notExisting', 10))
            .to.be.rejectedWith('element (#notExisting) still not existing after 10ms');
        });

        it('should pass through an error from isExisting()', function() {
            var client = this.client;
            var restore = function() {client.addCommand('isExisting', require('../../lib/commands/isExisting'), true);};
            this.client.addCommand('isExisting', function() {throw new Error("My error")}, true);

            return expect(this.client.waitForExist('#notExisting', duration))
            .to.be.rejectedWith("My error")
            .then(restore)
            .catch(function(err) {restore(); throw err;});
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

        it('should return with an error if the element never becomes selected', function() {
            return expect(this.client.waitForSelected('.option3', 10))
            .to.be.rejectedWith('element (.option3) still not selected after 10ms');
        });

        it('should pass through an error from isSelected()', function() {
            return expect(this.client.waitForSelected('#notExisting', duration, true))
            .to.be.rejectedWith("An element could not be located on the page using the given search parameters")
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

        it('should return with an error if the text never appears', function() {
            return expect(this.client.waitForText('.sometextlater', 10))
            .to.be.rejectedWith('element (.sometextlater) still without text after 10ms');
        });

        it('should pass through an error from getText()', function() {
            return expect(this.client.waitForText('#notExisting', duration, true))
            .to.be.rejectedWith("An element could not be located on the page using the given search parameters")
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

        it('should return with an error if the value never appears', function() {
            return expect(this.client.waitForValue('.waitForValueEnabledReverse', 10))
            .to.be.rejectedWith('element (.waitForValueEnabledReverse) still without a value after 10ms');
        });

        it('should pass through an error from getValue()', function() {
            return expect(this.client.waitForValue('#notExisting', duration, true))
            .to.be.rejectedWith("An element could not be located on the page using the given search parameters")
        });

    });

    describe('Visible', function() {
        var origIsVisible = null;

        beforeEach(h.setup());

        it('should return w/o err after element moved into document bounderies', function() {
            return this.client.waitForVisible('//*[contains(@class, "notVisible")]', duration).then(checkTime);
        });

        it('(reverse) should return w/o err after element left document bounderies', function() {
            return this.client.waitForVisible('.onMyWay', duration, true).then(checkTime);
        });

        it('should return with an error if the element never becomes visible', function() {
            return expect(this.client.waitForVisible('#notExisting', 10))
            .to.be.rejectedWith('element (#notExisting) still not visible after 10ms');
        });

        it('should pass through an error from isVisible()', function() {
            var client = this.client;
            var restore = function() {client.addCommand('isVisible', require('../../lib/commands/isVisible'), true);}
            this.client.addCommand('isVisible', function() {throw new Error("My error")}, true);

            return expect(this.client.waitForVisible('#notExisting', duration))
            .to.be.rejectedWith("My error")
            .then(restore)
            .catch(function(err) {restore(); throw err;});
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
