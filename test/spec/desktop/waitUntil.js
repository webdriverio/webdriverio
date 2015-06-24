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