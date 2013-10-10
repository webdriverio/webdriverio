/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

    describe('test addValue and setValue', function() {

        it('test setting values in input elements',function(done) {
            this.client.url(testpageURL).pause(1000);

            var checkError = function(err) {
                expect(err).to.be.null;
            };
            var chechValue = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'3');
            };

            for(var i = 0; i < 3; ++i) {
                this.client
                    .setValue('input.searchinput','0', checkError)
                    .setValue('input.searchinput','1', checkError)
                    .setValue('input.searchinput','2', checkError)
                    .setValue('input.searchinput','3', checkError)
                    .getValue('input.searchinput',     chechValue)
                    .clearElement('input.searchinput', checkError);
            }

            this.client.call(done);
        });

        it('test adding value in input elements',function(done) {
            this.client.url(testpageURL);

            var checkError = function(err) {
                expect(err).to.be.null;
            };
            var chechValue = function(err,result) {
                expect(err).to.be.null;
                assert.strictEqual(result,'0123');
            };

            for(var i = 0; i < 3; ++i) {
                this.client
                    .addValue('input.searchinput','0', checkError)
                    .addValue('input.searchinput','1', checkError)
                    .addValue('input.searchinput','2', checkError)
                    .addValue('input.searchinput','3', checkError)
                    .getValue('input.searchinput',     chechValue)
                    .clearElement('input.searchinput', checkError);
            }

            this.client.call(done);
        });

    });

};