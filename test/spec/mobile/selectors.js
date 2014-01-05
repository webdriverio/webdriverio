describe('test different selector strategies', function () {
    before(h.setup);

    it('should find an element using "css selector" method',function(done) {
        this.client
            .isVisible('.red',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('.red', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'css selector');
            })
            .call(done);
    });

    it('should find an element using "id" method',function(done) {
        this.client
            .isVisible('#purplebox',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('#purplebox', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'id');
            })
            .call(done);
    });

    it('should find an element using "name" method',function(done) {
        this.client
            .isVisible('[name="searchinput"]',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('[name="searchinput"]', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'name');
            })
            .call(done);
    });

    it('should find an element using "link text" method',function(done) {
        this.client
            .isVisible('=GitHub Repo',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('=GitHub Repo', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'link text');
            })
            .call(done);
    });

    it('should find an element using "partial link text" method',function(done) {
        this.client
            .isVisible('*=new',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('*=new', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'partial link text');
            })
            .call(done);
    });

    it('should find an element using "tag name" method and tag format <XXX />',function(done) {
        this.client
            .isVisible('<textarea />',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('<textarea />', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'tag name');
            })
            .call(done);
    });

    it('should find an element using "tag name" method and tag format <XXX>',function(done) {
        this.client
            .isVisible('<textarea>',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('<textarea>', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'tag name');
            })
            .call(done);
    });

    it('should find an element using "xpath" method',function(done) {
        this.client
            .isVisible('//html/body/section/div[6]/div/span',function(err,isVisible) {
                assert.equal(null, err);
                assert.equal(isVisible,true);
            })
            .getAttribute('//html/body/section/div[6]/div/span', 'data-foundBy', function(err,attr) {
                assert.equal(null, err);
                assert.equal(attr,'xpath');
            })
            .call(done);
    });

    // check if it is still backwards compatible for obsolete command
    it('should still work with obsolte command',function(done) {
        this.client
            .getElementCssProperty('css selector','.red', 'background-color', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('rgba(255,0,0,1)',result);
            })
            .call(done);
    });
});
