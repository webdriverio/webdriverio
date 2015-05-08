describe('selectorExecute', function() {
    before(h.setup());

    // TODO: css, xpath, name, id, tag name, link text, partial link text
    it('should be able to resolve a css selector', function() {
        return this.client.selectorExecute('[class="sometext"]', function(arr) {
            return arr[0].innerHTML;
        }).then(function(res) {
            assert.equal('some text', res);
        });
    });

    it('should be able to resolve an xpath selector', function() {
        return this.client.selectorExecute('//*[@class="sometext"]', function(arr) {
            return arr[0].innerHTML;
        }).then(function(res) {
            assert.equal('some text', res);
        });
    });

    it('should be able to resolve a name selector', function() {
        return this.client.selectorExecute('[name="searchinput"]', function(arr) {
            return arr[0].getAttribute('name');
        }).then(function(res) {
            assert.equal('searchinput', res);
        });
    });

    it('should be able to resolve an id selector', function() {
        return this.client.selectorExecute('#selectbox', function(arr) {
            return arr[0].getAttribute('id');
        }).then(function(res) {
            assert.equal('selectbox', res);
        });
    });

    it('should be able to resolve a tag name selector', function() {
        return this.client.selectorExecute('<select />', function(arr) {
            var found = 'nothing found';
            arr.forEach(function(el) {
                if (el.getAttribute('id') === 'selectbox') {
                    found = 'selectbox found';
                }
            });
            return found;
        }).then(function(res) {
            assert.equal('selectbox found', res);
        });
    });

    it('should be able to resolve a link text selector', function() {
        return this.client.selectorExecute('=GitHub Repo', function(arr) {
            return arr.length > 0 && arr[0].getAttribute('id');
        }).then(function(res) {
            assert.equal('githubRepo', res);
        });
    });

    it('should be able to resolve a partial link text selector', function() {
        return this.client.selectorExecute('*=GitHub ', function(arr) {
            return arr.length > 0 && arr[0].getAttribute('id');
        }).then(function(res) {
            assert.equal('githubRepo', res);
        });
    });

    it('should be able to accept args', function() {
        return this.client.selectorExecute('*=GitHub ', function(arr, arg) {
            return arr.length > 0 && arr[0].getAttribute('id') + arg;
        }, ' with an argument').then(function(res) {
            assert.equal('githubRepo with an argument', res);
        });
    });

    it('should be able to pass functions as args', function() {
        return this.client.selectorExecute('*=GitHub ', function(arr, arg) {
            return arg(arr.length > 0 && arr[0].getAttribute('id'));
        }, function(str) {
            return str + ' with an argument';
        }).then(function(res) {
            assert.equal('githubRepo with an argument', res);
        });
    });

    it('should be able to accept multiple selectors', function() {
        return this.client.selectorExecute(['*=GitHub ', '//*[@class="sometext"]'], function(links, divs, arg) {
            var returnStr = 'Returning ';
            links.length > 0 && (returnStr += links[0].getAttribute('id'));
            returnStr += ' and ';
            divs.length > 0 && (returnStr += divs[0].innerHTML);
            return arg(returnStr);
        }, function(str) {
            return str + ' with an argument';
        }).then(function(res) {
            assert.equal('Returning githubRepo and some text with an argument', res);
        });
    });

});