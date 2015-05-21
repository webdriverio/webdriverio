var Q = require('q');

describe('PromiseHandler', function() {

    before(h.setup());

    it('should sync promises with call', function(done) {
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

    it('should reject promise if command throws an error', function(done) {
        var result = null;
        this.client
            .click('#notExisting').then(function() {
                result = false;
            }, function() {
                result = true;
            })
            .call(function() {
                result.should.be.equal(true);
            })
            .call(done);
    });

    it('should handle waitfor commands within then callbacks', function(done) {
        this.client
            .getTitle().then(function() {
                return this.pause(1000).pause(100).isVisible('body');
            }).then(function(result) {
                result.should.be.true;
            })
            .call(done);
    });

    it('should provide a catch method that executes if the command throws an error', function(done) {
        var gotExecutedCatch = false;

        this.client
            .click('#notExisting').catch(function() {
                gotExecutedCatch = true;
            })
            .call(function() {
                gotExecutedCatch.should.be.true;
            })
            .call(done);
    });

    it('should provide a catch and fail method that doesn\'t execute if the command passes', function(done) {
        var gotExecutedCatch = false;

        this.client
            .click('body').catch(function() {
                gotExecutedCatch = true;
            })
            .call(function() {
                gotExecutedCatch.should.be.false;
            })
            .call(done);
    });

    it('should propagate not only promises but also objects or strings', function(done) {
        var hasBeenExecuted = 0;
        this.client
            .isVisible('body').then(function(isVisible) {
                hasBeenExecuted++;
                return isVisible;
            }).then(function(isVisible) {
                hasBeenExecuted++;
                isVisible.should.be.true;
                return 'a string';
            }).then(function(aString) {
                hasBeenExecuted++;
                aString.should.be.equal('a string');
                return { myElem: 42 };
            }).then(function(res) {
                hasBeenExecuted++;
                res.should.have.property('myElem');
                res.myElem.should.be.equal(42);
            })
            .call(function() {
                hasBeenExecuted.should.be.equal(4);
                done();
            });
    });

    it('should execute promise in a right order', function(done) {
        var self = this
            result = '';

        this.client.title().then(function() {
            result += '1';
            return self.client.call(function() {}).then(function() {
                result += '2';
                return self.client.then(function() {
                    result += '3';
                })
            })
        }).then(function() {
            result += '4';
        }).call(function() {
            result.should.be.equal('1234');
            done();
        })
    });

    it('should resolve array values', function(done) {
        // var value;
        this.client
            .title()
            .then(function() {
                return [1,2];
            }).then(function(value) {
                value.should.be.instanceof(Array).and.have.lengthOf(2);
            })
            .call(done);
    });

    describe('should be able to handle 3rd party promises', function() {

        it('should handle Q\'s deferred.promise', function(done) {

            var deferred = Q.defer();
            deferred.resolve('success');

            this.client
                .status()
                .then(function(){
                    return deferred.promise;
                })
                .then(function(result){
                    result.should.be.equal('success');
                })
                .call(done);

        });

        it('should handle ES6-Promise\'s promises', function(done) {
            var Promise = require('es6-promise').Promise;

            this.client
                .status()
                .then(function(){
                    return new Promise(function (resolve, reject) {
                        resolve('success')
                    })
                })
                .then(function(result){
                    result.should.be.equal('success');
                })
                .call(done);

        });

    });

    it('should be able to pass a command execution as parameter', function(done) {
        this.client
            .then(this.client.getTitle())
            .then(function(title) {
                title.should.be.exactly(conf.testPage.title);
            })
            .call(done);
    });

});
