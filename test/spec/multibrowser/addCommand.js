describe('addCommand', function() {

    before(h.setupMultibrowser());

    before(function() {

        this.matrix.addCommand('getUrlAndTitle', function() {

            var result = {};

            return this.url().then(function(res) {
                result.url = res.value;
            }).getTitle().then(function(title) {
                result.title = title;
            }).then(function() {
                return result;
            });

        });

        this.browserA.url(conf.testPage.gestureTest);
        this.browserB.url(conf.testPage.start);
        return this.matrix.sync();
    });

    it('added a `getUrlAndTitle` command', function() {
        return this.matrix.getUrlAndTitle().then(function(browserA, browserB) {
            assert.strictEqual(browserA.url, conf.testPage.gestureTest);
            assert.strictEqual(browserB.title, conf.testPage.title);
        });
    });

    it('should promisify added command', function() {

        return this.matrix.getUrlAndTitle().then(function(browserA, browserB) {
            assert.strictEqual(browserA.url, conf.testPage.gestureTest);
            assert.strictEqual(browserB.title, conf.testPage.title);
        });

    });

    it('should not register that command to other instances', function() {
        expect(this.browserA.getUrlAndTitle).to.be.a('function');
        expect(this.browserB.getUrlAndTitle).to.be.a('function');
    });

});