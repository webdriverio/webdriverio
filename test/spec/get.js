/* jshint -W024 */
/* jshint expr:true */

var fs = require('fs'),
    testpageSource;

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('get commands should return the evaluated value', function() {

        before(function(done) {

            // load source of testpage for getSource() test
            fs.readFile('./test/index.php', function (err, html) {
                if (err) {
                    throw err;
                }
                testpageSource = html.toString();
                this.client.url(testpageURL).call(done);
            }.bind(this));

        });

        it('getAttribute: style of elem .nested should be "text-transform:uppercase;"', function(done){
            this.client.getAttribute('.nested', 'style', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result.trim(),'text-transform: uppercase;');
            }).call(done);
        });

        it('getElementCssProperty: css selector of elem .red should be "rgba(255,0,0,1)"', function(done){
            this.client.getElementCssProperty('css selector', '.red', 'background-color', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('rgba(255,0,0,1)',result);
            }).call(done);
        });

        it('getCssProperty: float css attribute of .green should be "left"', function(done){
            this.client.getCssProperty('.green', 'float', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('left',result);
            }).call(done);
        });

        it('getElementCssProperty: width of elem with class name yellow should be "100px"', function(done){
            this.client.getElementCssProperty('class name', 'yellow', 'width', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('100px',result);
            }).call(done);
        });

        it('getCssProperty: background-color of elem .black should be "rgba(0,0,0,1)"', function(done){
            this.client.getCssProperty('.black', 'background-color', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('rgba(0,0,0,1)',result);
            }).call(done);
        });

        it('getElementCssProperty: leftmargin of elem with ID purplebox should be "10px"', function(done){
            this.client.getElementCssProperty('id', 'purplebox', 'margin-right', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('10px',result);
            }).call(done);
        });

        it('getCssProperty: rightmargin of elem .purple should be "10px"', function(done){
            this.client.getCssProperty('.purple', 'margin-right', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual('10px',result);
            }).call(done);
        });

        it('getElementSize: size of elem .red should be 102x102px', function(done){
            this.client.getElementSize('.red', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result.width,102);
                assert.strictEqual(result.height,102);
            }).call(done);
        });

        it('getLocation: location of elem .green should be x=120 , y=89', function(done){
            this.client.getLocation('.green', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result.x,120);
                assert(result.y === 89 || result.y === 94);
            }).call(done);
        });

        it('getLocationInView: location of elem .green should be x=120 , y=89', function(done){
            this.client.getLocationInView('.green', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result.x,120);
                assert(result.y === 89 || result.y === 94);
            }).call(done);
        });

        it('getSource: source code of testpage should be the same as the code, which was fetched before test', function(done){
            this.client.getSource(function(err,result) {
                expect(err).to.be.null;

                // remove not visible php code
                testpageSource = testpageSource.replace(/<\?php[^?]*\?>\n/g,'');

                assert.strictEqual(result,testpageSource);
            }).call(done);
        });

        it('getTagName: tag name of elem .black should be "div"', function(done){
            this.client.getTagName('.black', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'div');
            }).call(done);
        });

        it('getTagName: tag name of elem #githubRepo should be "a"', function(done){
            this.client.getTagName('#githubRepo', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'a');
            }).call(done);
        });

        it('getText: content of elem #githubRepo should be "GitHub Repo"', function(done){
            this.client.getText('#githubRepo', function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'GitHub Repo');
            }).call(done);
        });

        it('getTitle: title of testpage should be "'+testpageTitle+'"', function(done){
            this.client.getTitle(function(err,title) {
                expect(err).to.be.null;
                assert.strictEqual(title,testpageTitle);
            }).call(done);
        });

    });

};