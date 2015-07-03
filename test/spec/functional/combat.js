describe('WebdriverIO is backwards compatible', function() {

    before(h.setup());

    it('should support the old callback system', function(done) {
       this.client
            .getTitle(function(err, title) {
                expect(err).to.be.undefined;
                title.should.be.exactly(conf.testPage.title);
            })
            .call(done);
    });

    it('should not whine if command errors', function(done) {
        this.client
            .element('#notFound', function(err, title) {
                expect(err).not.to.be.undefined;
                expect(title).to.be.undefined;
            })
            .call(done);
    });

    it('should work with multipe functions as arguments', function(done) {
        this.client
            .execute(function() {
                return 42;
            }, function(err, res) {
                expect(err).to.be.undefined;
                res.value.should.be.exactly(42);
            })
            .call(done);
    });

    it('should work with selectorExecute', function(done) {
        this.client
            .selectorExecute('body',function(_, number, cb) {
                return cb(number);
            }, 7, function(number) {
                return number + 35;
            }, function() {
                throw new Error('I should never get executed!');
            })
            .call(done);
    });

    it('should work with selectorExecute without callback', function(done) {
        this.client
            .selectorExecute('body',function(_, number, cb) {
                return cb(number);
            }, 7, function(number) {
                return number + 35;
            }).then(function(res) {
                res.should.be.exactly(42);
            })
            .call(done);
    });

    describe('promise support in callbacks', function() {

        it('should propagate values', function(done) {
            this.client
                .getTitle(function(err, title) {
                    expect(err).to.be.undefined;
                    return title;
                }).then(function(title) {
                    title.should.be.exactly(conf.testPage.title);
                })
                .call(done);
        });

        it('should wait on other promises', function(done) {
            this.client
                .getTitle(function() {
                    return this.url();
                }).then(function(url) {
                    url.value.should.be.exactly(conf.testPage.start);
                })
                .call(done);
        });

    });

    it('should allow nested command execution if return gets used', function(done) {

        var result = '';
        this.client
            .getTitle(function() {
                result += '1';

                return this.getHTML(function() {
                    result += '2';

                }).getSource(function() {
                    result += '3';

                    return this.getText('body', function() {
                        result += '4';

                        return this.getHTML(function() {
                            result += '5';

                        }).getSource(function() {
                            result += '6';

                            return this.getText('body', function() {
                                result += '7';
                            });
                        });
                    });
                });

            })
            .url(function() {
                result.should.be.exactly('1234567');
            })
            .call(done);

    });

});