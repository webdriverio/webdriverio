describe('back', function() {

    before(h.setup());

    it('should be able to go backward in history', function(done){
        this.client
            /**
             * first create a history
             */
            .click('=two')
            /**
             * go back in history
             */
            .back()
            /**
             * did it work?
             */
            .getTitle(function(err,title) {
                assert.ifError(err);
                title.should.be.exactly('WebdriverJS Testpage');
            })
            .call(done);
    });

})