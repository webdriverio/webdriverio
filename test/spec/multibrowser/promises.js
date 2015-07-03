describe('PromiseHandler', function() {

    before(h.setupMultibrowser());

    it('should sync promises with call', function() {
        var result = '';
        return this.matrix.then(function() {
            result += '1';
        }).then(function() {
            result += '2';
        }).then(function() {
            result += '3';
        }).then(function() {
            result += '4';
        }).call(function() {
            result.should.be.equal('1234');
        });
    });

    it('should propagate results to then', function() {
        return this.matrix.getTitle().then(function(browserA, browserB) {
            browserA.should.be.equal('WebdriverJS Testpage');
            browserB.should.be.equal('WebdriverJS Testpage');
            return this.url();
        }).then(function(browserA, browserB) {
            browserA.value.should.be.equal(conf.testPage.start);
            browserB.value.should.be.equal(conf.testPage.start);
        }).then(function(result) {
            /**
             * undefined because last then doesn't return a promise
             */
            (result === undefined).should.be.true;
        });
    });

    it('should be working on custom commands', function() {
        var result = '';

        this.matrix.addCommand('fakeCommand', function(param) {
            return param;
        });

        return this.matrix.fakeCommand(0).then(function() {
            return this.fakeCommand(1);
        }).then(function(res) {
            result += res.toString();
            return this.fakeCommand(2);
        }).then(function(res) {
            result += res.toString();
            return this.fakeCommand(3);
        }).then(function(res) {
            result += res.toString();
            return this.fakeCommand(4);
        }).then(function(res) {
            result += res.toString();
        }).call(function() {
            result.should.be.equal('1234');
        });

    });

    it('should reject promise if command throws an error', function() {
        var result = null;
        return this.matrix.click('#notExisting').then(function() {
            result = false;
        }, function() {
            result = true;
        }).call(function() {
            result.should.be.equal(true);
        });
    });

    it('should handle waitfor commands within then callbacks', function() {
        return this.matrix.getTitle().then(function() {
            return this.pause(1000).pause(100).isVisible('body');
        }).then(function(browserA, browserB) {
            browserA.should.be.true;
            browserB.should.be.true;
        });
    });

    it('should provide a catch and fail method that executes if the command throws an error', function() {
        var gotExecutedCatch = false;
        return this.matrix.click('#notExisting').catch(function() {
            gotExecutedCatch = true;
        }).call(function() {
            gotExecutedCatch.should.be.true;
        });
    });

    it('should provide a catch and fail method that doesn\'t execute if the command passes', function() {
        var gotExecutedCatch = false;
        return this.matrix.click('body').catch(function() {
            gotExecutedCatch = true;
        }).call(function() {
            gotExecutedCatch.should.be.false;
        });
    });

    it('should propagate not only promises but also objects or strings', function() {
        var hasBeenExecuted = 0;
        return this.matrix.isVisible('body').then(function(browserA, browserB) {
            hasBeenExecuted++;
            return {
                browserA: browserA,
                browserB: browserB
            };
        }).then(function(isVisible) {
            hasBeenExecuted++;
            isVisible.browserA.should.be.true;
            isVisible.browserB.should.be.true;
            return 'a string';
        }).then(function(aString) {
            hasBeenExecuted++;
            aString.should.be.equal('a string');
            return { myElem: 42 };
        }).then(function(res) {
            hasBeenExecuted++;
            res.should.have.property('myElem');
            res.myElem.should.be.equal(42);
        }).call(function() {
            hasBeenExecuted.should.be.equal(4);
        });
    });

});