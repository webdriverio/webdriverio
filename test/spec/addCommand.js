/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    it('test addCommand feature',function(done) {
        
        this.client
            .addCommand("getUrlAndTitle", function(callback) {
                this.url(function(err,urlResult) {
                    this.getTitle(function(err,titleResult) {
                        var specialResult = {url: urlResult.value, title: titleResult};
                        if (typeof callback == "function") {
                            callback(err,specialResult);
                        }
                    });
                });
            })
            .url('http://www.github.com')
            .getUrlAndTitle(function(err,result){
                expect(err).to.be.null;
                assert.strictEqual(result.url,'https://github.com/');
                assert.strictEqual(result.title,'GitHub · Build software better, together.');
            })
            .call(done);

    });

};