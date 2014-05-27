describe('forward', function() {

    before(h.setup());

    it('should be able to go forward in history', function(done){
        this.client
            /**
             * first create a history
             */
            .click('=two')
            /**
             * go back in history (via execute)
             * here we just want to test the forward command
             */
            .execute('history.go(-1)')
            /**
             * now go back in history
             */
            .forward()
            .pause(100)
            /**
             * did it work?
             */
            .getTitle(function(err,title) {
                assert.ifError(err);
                title.should.be.exactly('two');
            })
            .call(done);
    });

})