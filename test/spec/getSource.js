describe('getSource', function() {

    before(h.setup());

    it('should return the source code of the whole website', function(){
        return this.client.getSource().then(function (source) {
            source.indexOf('Test CSS Attributes').should.be.greaterThan(0);
            source.indexOf('open new tab').should.be.greaterThan(0);
            source.indexOf('$(\'.btn3_clicked\').css(\'display\',\'block\');').should.be.greaterThan(0);
            source.indexOf('</html>').should.be.greaterThan(0);
        });
    });

});