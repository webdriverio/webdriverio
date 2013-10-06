/* jshint -W024 */
/* jshint expr:true */

module.exports = function(testpageURL,testpageTitle,assert,should,expect){

	describe('test unicode characters', function() {

        var checkError = function(err) {
            expect(err).to.be.null;
        };

        it('input should have an empty value after using delete command', function(done) {
            this.client
                .url(testpageURL)
                .addValue('input.searchinput','012', checkError)
                .addValue('input.searchinput','Left arrow', checkError)
                .addValue('input.searchinput','Left arrow', checkError)
                .addValue('input.searchinput','Left arrow', checkError)
                .addValue('input.searchinput','Delete', checkError)
                .addValue('input.searchinput','Delete', checkError)
                .addValue('input.searchinput','Delete', checkError)
                .getValue('input.searchinput', function(err,value) {
                    expect(err).to.be.null;
                    assert.strictEqual(value,'');
                })
                .call(done);
        });

        it('input should have an empty value after using Back space command', function(done) {
            this.client
                .url(testpageURL)
                .addValue('input.searchinput','012', checkError)
                .addValue('input.searchinput','Back space', checkError)
                .addValue('input.searchinput','Back space', checkError)
                .addValue('input.searchinput','Back space', checkError)
                .getValue('input.searchinput', function(err,value) {
                    expect(err).to.be.null;
                    assert.strictEqual(value,'');
                })
                .call(done);
        });

        it('input should have one space as input', function(done) {
            this.client
                .url(testpageURL)
                .addValue('input.searchinput','Space', checkError)
                .getValue('input.searchinput', function(err,value) {
                    expect(err).to.be.null;
                    assert.strictEqual(value,' ');
                })
                .call(done);
        });

        it('input should contains contain special characters created by modifier keys (Shift|Alt)', function(done) {
            this.client
                .url(testpageURL)
                // to release the modifier a 'NULL' has to encounter, if not it should be held down
                .setValue('input.searchinput',['Shift','1','NULL','Shift','2','3','4','NULL','Shift','5','6','NULL','Shift','7','NULL','Shift','8','9','0'], function(err){
                    expect(err).to.be.null;
                })
                .getValue('input.searchinput', function(err,res) {
                    expect(err).to.be.null;
                    // expect sepcial character according to american keyboard layout
                    assert.strictEqual(res,'!@#$%^&*()');
                })
                .call(done);
        });

        it('should add number characters via numpad', function(done) {
            this.client
                .url(testpageURL)
                .setValue('.searchinput',['Numpad 0','Numpad 1','Numpad 2','Numpad 3','Numpad 4','Numpad 5','Numpad 6','Numpad 7','Numpad 8','Numpad 9'], function(err) {
                    expect(err).to.be.null;
                })
                .getValue('.searchinput', function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,'0123456789');
                })
                .call(done);
        });

        it('it should cut&paste a text via Control + x and Control + v', function(done) {
            var text = 'test';

            this.client
                .url(testpageURL)
                // first set some text
                .setValue('.searchinput',text,function(err) {
                    expect(err).to.be.null;
                })
                // mark text via shift + left arrow
                .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], function(err) {
                    expect(err).to.be.null;
                })
                // cut text
                .addValue('.searchinput',['Control','x','NULL'],function(err) {
                    expect(err).to.be.null;
                })
                // test: input field should be empty
                .getValue('.searchinput',function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,'');
                })
                // paste value from clipboard
                .addValue('.searchinput',['Control','v'],function(err) {
                    expect(err).to.be.null;
                })
                .getValue('.searchinput',function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,text);
                })
                .call(done);
        });

        it('it should copy&paste a text via Control + c and Control + v', function(done) {
            var text = 'test';

            this.client
                .url(testpageURL)
                // first set some text
                .setValue('.searchinput',text,function(err) {
                    expect(err).to.be.null;
                })
                // mark text via shift + left arrow
                .addValue('.searchinput',['Shift','Left arrow','Left arrow','Left arrow','Left arrow','NULL'], function(err) {
                    expect(err).to.be.null;
                })
                // copy text and move cursor to the end of the input field
                .addValue('.searchinput',['Control','c','NULL','Right arrow'],function(err) {
                    expect(err).to.be.null;
                })
                // test: input field should contain test value
                .getValue('.searchinput',function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,text);
                })
                // paste value from clipboard
                .addValue('.searchinput',['Control','v'],function(err) {
                    expect(err).to.be.null;
                })
                .getValue('.searchinput',function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,text + text);
                })
                .call(done);
        });

        it('a new addValue command should release the modifier key', function(done) {
            this.client
                .url(testpageURL)
                .addValue('.searchinput',['Shift','1'],function(err) {
                    expect(err).to.be.null;
                })
                .addValue('.searchinput',['1'],function(err) {
                    expect(err).to.be.null;
                })
                .getValue('.searchinput',function(err,res) {
                    expect(err).to.be.null;
                    assert.strictEqual(res,'!1');
                })
                .call(done);
        });
    });
};