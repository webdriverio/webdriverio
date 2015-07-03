describe('chai-as-promised', function() {

    /**
     *  Remove the `should` global on Object.prototype to allow chai.should for these tests,
     *  and set up chai, chai-as-promised and chai.should properly
     */

    require('should').noConflict();

    var chai = require('chai');
    var chaiAsPromised = require('chai-as-promised');

    chai.Should();
    chai.use(chaiAsPromised);

    before(h.setup());

    beforeEach(function() {
        chaiAsPromised.transferPromiseness = this.client.transferPromiseness;
    });

    after(function() {
        /**
         *  Restore the original `should` library to allow other tests to use it
         */
        var should = require('should');
        should.extend('should', Object.prototype);
    });

    it('should handle a single promise', function() {

        return this.client.getTitle()
            .should.eventually.equal('WebdriverJS Testpage');

    });

    it('should allow chaining of further promises', function() {

        return this.client
            .isVisible('body').should.eventually.be.true
            .getTitle().should.eventually.equal('WebdriverJS Testpage');

    });

    it('should handle failed assertions', function() {

        return this.client
            .isVisible('body').should.eventually.be.true
            .getTitle().should.eventually.equal('some other title')
            .catch(function(e) {
                e.should.be.an.instanceof(Error);
            });

    });

    it('should support deep comparisons', function() {
        return this.client.getText('#selectbox option').should.become(['1', '2', '3']);
    });

});