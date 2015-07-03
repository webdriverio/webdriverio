describe('selectorExecute', function() {
    before(h.setupMultibrowser());

    it('should be able to accept multiple selectors', function() {
        return this.matrix.selectorExecute(['*=GitHub ', '//*[@class="sometext"]'], function(links, divs, arg) {
            var returnStr = 'Returning ';
            links.length > 0 && (returnStr += links[0].getAttribute('id'));
            returnStr += ' and ';
            divs.length > 0 && (returnStr += divs[0].innerHTML);
            return arg(returnStr);
        }, function(str) {
            return str + ' with an argument';
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('Returning githubRepo and some text with an argument');
            browserB.should.be.equal('Returning githubRepo and some text with an argument');
        });
    });

    // TODO: css, xpath, name, id, tag name, link text, partial link text
    it('should be able to resolve a css selector', function() {
        return this.matrix.selectorExecute('[class="sometext"]', function(arr) {
            return arr[0].innerHTML;
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('some text');
            browserB.should.be.equal('some text');
        });
    });

    it('should be able to resolve an xpath selector', function() {
        return this.matrix.selectorExecute('//*[@class="sometext"]', function(arr) {
            return arr[0].innerHTML;
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('some text');
            browserB.should.be.equal('some text');
        });
    });

    it('should be able to resolve a name selector', function() {
        return this.matrix.selectorExecute('[name="searchinput"]', function(arr) {
            return arr[0].getAttribute('name');
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('searchinput');
            browserB.should.be.equal('searchinput');
        });
    });

    it('should be able to resolve an id selector', function() {
        return this.matrix.selectorExecute('#selectbox', function(arr) {
            return arr[0].getAttribute('id');
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('selectbox');
            browserB.should.be.equal('selectbox');
        });
    });

    it('should be able to resolve a tag name selector', function() {
        return this.matrix.selectorExecute('<select />', function(arr) {
            var found = 'nothing found';
            arr.forEach(function(el) {
                if (el.getAttribute('id') === 'selectbox') {
                    found = 'selectbox found';
                }
            });
            return found;
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('selectbox found');
            browserB.should.be.equal('selectbox found');
        });
    });

    it('should be able to resolve a link text selector', function() {
        return this.matrix.selectorExecute('=GitHub Repo', function(arr) {
            return arr.length > 0 && arr[0].getAttribute('id');
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('githubRepo');
            browserB.should.be.equal('githubRepo');
        });
    });

    it('should be able to resolve a partial link text selector', function() {
        return this.matrix.selectorExecute('*=GitHub ', function(arr) {
            return arr.length > 0 && arr[0].getAttribute('id');
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('githubRepo');
            browserB.should.be.equal('githubRepo');
        });
    });

    it('should be able to accept args', function() {
        return this.matrix.selectorExecute('*=GitHub ', function(arr, arg) {
            return arr.length > 0 && arr[0].getAttribute('id') + arg;
        }, ' with an argument', function(err, res) {
            res.browserA.should.be.equal('githubRepo with an argument');
            res.browserB.should.be.equal('githubRepo with an argument');
        });
    });

    it('should be able to pass functions as args', function() {
        return this.matrix.selectorExecute('*=GitHub ', function(arr, arg) {
            return arg(arr.length > 0 && arr[0].getAttribute('id'));
        }, function(str) {
            return str + ' with an argument';
        }).then(function(browserA, browserB) {
            browserA.should.be.equal('githubRepo with an argument');
            browserB.should.be.equal('githubRepo with an argument');
        });
    });

});