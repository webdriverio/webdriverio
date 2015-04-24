describe('forward', function() {

    before(h.setup());

    it('should be able to go forward in history', function(){
        return this.client
            /**
             * first create a history
             */
            .click('=two')
            .pause(3000)
            /**
             * go back in history (via execute)
             * here we just want to test the forward command
             */
            .back()
            .pause(3000)
            /**
             * now go back in history
             */
            .forward()
            .pause(1000)
            /**
             * did it work?
             */
            .getTitle().then(function (title) {
                title.should.be.exactly('two');
            });
    });

});