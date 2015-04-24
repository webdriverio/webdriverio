describe('back', function() {

    before(h.setup());

    it('should be able to go backward in history', function(){
        return this.client
            /**
             * first create a history
             */
            .click('=two')
            .pause(3000)
            /**
             * go back in history
             */
            .back()
            .pause(3000)
            /**
             * did it work?
             */
            .getTitle().then(function(title) {
                title.should.be.exactly('WebdriverJS Testpage');
            });
    });

});