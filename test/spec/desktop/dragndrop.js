describe('drag&drop command test', function() {
    before(h.setup());

    it('should drag and drop an element', function() {

        /**
         * skip for ie
         * not working anymore
         */
        if(process.env._BROWSER === 'internet_explorer') {
            return;
        }

        return this.client.getValue('.searchinput').then(function(res) {
            res.should.be.equal('');
        }).dragAndDrop('.ui-draggable','.red').getValue('.searchinput').then(function(res) {
            res.should.be.equal('Dropped!');
        });
    });

});
