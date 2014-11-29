describe('Promises', function() {

    before(h.setup());

    it('sync promises with call', function(done) {
        var result = '';
        this.client
            .then(function() {
                result += '1';
            })
            .then(function() {
                result += '2';
            })
            .then(function() {
                result += '3';
            })
            .then(function() {
                result += '4';
            })
            .call(function() {
                result.should.be.equal('1234');
            })
            .call(done);
    });

    it('should propagate results to then', function(done) {
        this.client
            .getTitle().then(function(title) {
                title.should.be.equal('WebdriverJS Testpage');
                return this.url();
            })
            .then(function(url) {
                url.value.should.be.equal(conf.testPage.start);
            })
            .then(function(result) {
                /**
                 * undefined because last then doesn't return a promise
                 */
                (result === undefined).should.be.true;
            })
            .call(done)
    });

    it('should be working on custom commands', function(done) {
        var result = '';

        this.client.addCommand('fakeCommand', function(param, done) {
            done(undefined, param);
        });

        this.client
            .fakeCommand(0)
            .then(function() {
                return this.fakeCommand(1);
            })
            .then(function(res) {
                result += res.toString();
                return this.fakeCommand(2);
            })
            .then(function(res) {
                result += res.toString();
                return this.fakeCommand(3);
            })
            .then(function(res) {
                result += res.toString();
                return this.fakeCommand(4);
            })
            .then(function(res) {
                result += res.toString();
            })
            .call(function() {
                result.should.be.equal('1234');
            })
            .call(done);

    });

});