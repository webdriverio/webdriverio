describe('addCommand', function() {

    before(h.setup());

    function getUrlAndTitle() {

        var result = {};

        return this.url().then(function(url) {
            result.url = url.value;
        }).getTitle().then(function(title) {
            result.title = title;
        }).then(function() {
            return result;
        });

    }

    describe('add regular command', function() {

        before(function() {
            this.client.addCommand('getUrlAndTitle', getUrlAndTitle);
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

    describe.only('add a namespaced command', function() {

        it('should add a namespaced getUrlAndTitle', function() {
            this.client.addCommand('mynamespace', 'getUrlAndTitle', getUrlAndTitle);
            return this.client.mynamespace.getUrlAndTitle().then(function(result) {
                assert.strictEqual(result.url, conf.testPage.start);
                assert.strictEqual(result.title, conf.testPage.title);
            });
        });

        it('should not allow overwriting internal functions', function() {
            var self = this;

            (function(){
                self.client.addCommand('shake', 'mycommand', function() {
                    return 'should fail';
                }, true);
            }).should.throw();
        });

        it('should not overwrite commands by default', function() {
            this.client.addCommand('mynamespace', 'mycommand', getUrlAndTitle);

            var self = this;

            (function(){
                self.client.addCommand('mynamespace', 'mycommand', function() {
                    return 'should fail';
                });
            }).should.throw();
        });

        it('should overwrite existing namespaced method if overwrite flag is given', function() {
            this.client.addCommand('mynamespace', 'mysecondcommand', getUrlAndTitle);

            this.client.addCommand('mynamespace', 'mysecondcommand', function() {
                return 'should not fail';
            }, true);

            return this.client.mynamespace.mysecondcommand().then(function(res) {
                expect(res).to.be.equal('should not fail');
            });
        });

    });

});
