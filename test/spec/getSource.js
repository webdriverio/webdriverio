describe('getSource', function() {

    before(h.setup());

    it('should return the source code of the whole website', function(done){
        this.client
            .getSource(function(err,source) {
                assert.ifError(err);
                source.indexOf('Test CSS Attributes').should.be.greaterThan(0);
                source.indexOf('open new tab').should.be.greaterThan(0);
                source.indexOf('$(\'.btn3_clicked\').css(\'display\',\'block\');').should.be.greaterThan(0);
                source.indexOf('</html>').should.be.greaterThan(0);
            })
            .call(done);
    });

});