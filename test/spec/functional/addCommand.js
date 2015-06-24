describe('addCommand', function() {

    before(h.setup());

    describe('add regular command', function() {

        before(function() {
            this.client.addCommand('getUrlAndTitle', function() {

                var result = {};

                return this.url().then(function(url) {
                    result.url = url.value;
                }).getTitle().then(function(title) {
                    result.title = title;
                }).then(function() {
                    return result;
                });

            });
        });

        it('added a `getUrlAndTitle` command', function() {
            return this.client.getUrlAndTitle().then(function(result) {
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            });
        });

        it('should promisify added command', function() {
            return this.client.getUrlAndTitle().then(function(result) {
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            });
        });

    });

    describe('try to add an existing command', function() {

        it('should throw an error', function() {
            var self = this;

            (function(){
                self.client.addCommand('shake', function() {
                    return 'should fail';
                });
            }).should.throw();
        });

        it('should overwrite existing method if overwrite flag is given', function() {
            this.client.addCommand('shake', function() {
                return 'should not fail';
            }, true);

            return this.client.shake().then(function(res) {
                expect(res).to.be.equal('should not fail');
            });
        });

    });

});