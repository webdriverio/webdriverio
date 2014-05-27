describe('getHTML', function() {

    before(h.setup());

    it('should return html of given selector including the selector element', function(done) {
        this.client
            .getHTML('.nested div', function(err, html) {
                assert.equal(err, null);
                html.should.be.exactly('<div><span data-foundby="xpath" style="position: relative; " class="ui-draggable">nested span</span></div>');
            })
            .call(done);
    });

    it('should return html of given selector excluding the selector element', function(done) {
        this.client
            .getHTML('.nested div', false, function(err, html) {
                assert.equal(err, null);
                html.should.be.exactly('<span data-foundby="xpath" style="position: relative; " class="ui-draggable">nested span</span>');
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