describe('getHTML', function() {

    before(h.setup());

    it('should return html of given selector including the selector element', function(done) {
        this.client
            .getHTML('.nested aside', function(err, html) {
                assert.equal(err, null);
                html.should.be.exactly('<aside><h3>more nested</h3></aside>');
            })
            .call(done);
    });

    it('should support native selenium selector strategy like partial link', function(done) {
        this.client
            .getHTML('*=new tab', function(err, html) {
                assert.equal(err, null);
                html.should.be.exactly('<a id="newWindow" href="./two.html" target="_blank" data-foundby="partial link text">open new tab</a>');
            })
            .call(done);
    });

    it('should return html of given selector excluding the selector element', function(done) {
        this.client
            .getHTML('.nested aside', false, function(err, html) {
                assert.equal(err, null);
                html.should.be.exactly('<h3>more nested</h3>');
            })
            .call(done);
    });

    it('should return html of multiple elements', function(done) {
        this.client
            .getHTML('.box', function(err, html) {
                assert.equal(err, null);
                html.should.be.an.instanceOf(Array);
                html.should.have.length(5);
                html.should.containEql('<div class="box red ui-droppable" data-foundby="css selector"></div>');
                html.should.containEql('<div class="box green"></div>');
                html.should.containEql('<div class="box yellow"></div>');
                html.should.containEql('<div class="box black"></div>');
                html.should.containEql('<div class="box purple" id="purplebox" data-foundby="id"></div>');
            })
            .call(done);
    });

});