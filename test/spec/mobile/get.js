describe('get commands should return the evaluated value', function() {
    before(h.setup);

    it('getAttribute: style of elem .nested should be "text-transform:uppercase;"', function(done){
        this.client
            .getAttribute('.nested', 'style', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result.trim(),'text-transform: uppercase;');
                done(err);
            });
    });

    it('getCssProperty: css selector of elem .red should be "rgba(255,0,0,1)"', function(done){
        this.client
            .getCssProperty('.red', 'background-color', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('rgba(255,0,0,1)',result);
                done(err);
            });
    });

    it('getCssProperty: float css attribute of .green should be "left"', function(done){
        this.client
            .getCssProperty('.green', 'float', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('left',result);
                done(err);
            });
    });

    it('getCssProperty: width of elem with class name yellow should be "100px"', function(done){
        this.client
            .getCssProperty('.yellow', 'width', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('100px',result);
                done(err);
            });
    });

    it('getCssProperty: background-color of elem .black should be "rgba(0,0,0,1)"', function(done){
        this.client
            .getCssProperty('.black', 'background-color', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('rgba(0,0,0,1)',result);
                done(err);
            });
    });

    it('getElementCssProperty: leftmargin of elem with ID purplebox should be "10px"', function(done){
        this.client
            .getCssProperty('#purplebox', 'margin-right', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('10px',result);
                done(err);
            });
    });

    it('getCssProperty: rightmargin of elem .purple should be "10px"', function(done){
        this.client
            .getCssProperty('.purple', 'margin-right', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual('10px',result);
                done(err);
            });
    });

    it('getElementSize: size of elem .red should be 102x102px', function(done){
        this.client
            .getElementSize('.red', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result.width,102);
                assert.strictEqual(result.height,102);
                done(err);
            });
    });

    it.skip('[not implemented in appium] getLocationInView: location of elem .green should be x=127 , y=198', function(done){
        var that = this;

        this.client
            .getLocationInView('.green', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result.x,127);
                assert.strictEqual(result.y,that.client.desiredCapabilities.browserName === 'phantomjs' ? 198 : 242);
                done(err);
            });
    });

    it('getSource: source code of testpage should be the same as the code, which was fetched before test', function(done){
        this.client
            .getSource(function(err,result) {
                assert.equal(null, err);

                assert(
                    result.indexOf('Test CSS Attributes') > 0 &&
                    result.indexOf('open new tab') > 0 &&
                    result.indexOf('$(\'.btn3_clicked\').css(\'display\',\'block\');') > 0 &&
                    result.indexOf('</html>') > 0
                );
                done(err);
            });
    });

    it('getTagName: tag name of elem .black should be "div"', function(done){
        this.client
            .getTagName('.black', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result,'div');
                done(err);
            });
    });

    it('getTagName: tag name of elem #githubRepo should be "a"', function(done){
        this.client
            .getTagName('#githubRepo', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result,'a');
                done(err);
            });
    });

    it('getText: content of elem #githubRepo should be "GitHub Repo"', function(done){
        this.client
            .getText('#githubRepo', function(err,result) {
                assert.equal(null, err);
                assert.strictEqual(result,'GitHub Repo');
                done(err);
            });
    });

    it('getTitle: title of testpage should be "'+conf.testPage.title+'"', function(done){
        this.client
            .getTitle(function(err,title) {
                assert.equal(null, err);
                assert.strictEqual(title,conf.testPage.title);
                done(err);
            });
    });

});