/*jshint expr: true*/
/*global beforeEach*/
describe('waitFor',function() {

    var duration = 3500;
    var checkTime = function(startTime, done) {
        return function(err, res) {
            assert.equal(err, null);
            res.should.be.true;
            done();
        };
    };

    describe('(traditional selenium)', function() {

        before(h.setup());

        it('should at least wait until duration has expired', function(done) {

            var startTime = Date.now();
            this.client
                .waitFor('#new-element', 500, function(){}) // this element doesnt exist
                .call(function() {
                    var delta = Date.now() - startTime;
                    assert(delta > 499);
                })
                .call(done);

        });

        it('should return without error after element appears in time',function(done) {
            this.client.waitFor('.lateElem', 5000, done);
        });

    });

    describe('Checked', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was checked', function(done) {
            var currentTime = Date.now();
            this.client.waitForChecked('.radio_waitForSelected', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element was unchecked', function(done) {
            var currentTime = Date.now();
            this.client.waitForChecked('.radio_waitForSelectedReverse', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Enabled', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was enabled', function(done) {
            var currentTime = Date.now();
            this.client.waitForEnabled('.waitForValueEnabled', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element was disabled', function(done) {
            var currentTime = Date.now();
            this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Exist', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was appended to the DOM', function(done) {
            var currentTime = Date.now();
            this.client.waitForExist('.lateElem', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element was removed from the DOM', function(done) {
            var currentTime = Date.now();
            this.client.waitForExist('.goAway', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Selected', function() {

        beforeEach(h.setup());

        it('should return w/o err after element was selected', function(done) {
            var currentTime = Date.now();
            this.client.waitForSelected('.option3', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element was unselected', function(done) {
            var currentTime = Date.now();
            this.client.waitForSelected('.option2', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Text', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a text/content', function(done) {
            var currentTime = Date.now();
            this.client.waitForText('.sometextlater', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after text/content element was removed', function(done) {
            var currentTime = Date.now();
            this.client.waitForText('.sometext', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Value', function() {

        beforeEach(h.setup());

        it('should return w/o err after element got a value', function(done) {
            var currentTime = Date.now();
            this.client.waitForEnabled('.waitForValueEnabled', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element lost its value', function(done) {
            var currentTime = Date.now();
            this.client.waitForEnabled('.waitForValueEnabledReverse', duration, true, checkTime(currentTime, done));
        });

    });

    describe('Visible', function() {

        beforeEach(h.setup());

        it('should return w/o err after element moved into document bounderies', function(done) {
            var currentTime = Date.now();
            this.client.waitForVisible('.notInViewport', duration, checkTime(currentTime, done));
        });

        it('(reverse) should return w/o err after element left document bounderies', function(done) {
            var currentTime = Date.now();
            this.client.waitForVisible('.onMyWay', duration, true, checkTime(currentTime, done));
        });

    });

});
