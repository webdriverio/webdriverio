describe('getHTML', function() {

    before(h.setup());

    it('should return html of given selector including the selector element', function() {
        return this.client.getHTML('.moreNesting section').then(function (html) {
            html.should.be.exactly('<section><span>bar</span></section>');
        });
    });

    it('should support native selenium selector strategy like partial link', function() {
        return this.client.getHTML('*=new tab').then(function (html) {
            html.should.be.exactly('<a id="newWindow" href="./two.html" target="_blank" data-foundby="partial link text">open new tab</a>');
        });
    });

    it('should return html of given selector excluding the selector element', function() {
        return this.client.getHTML('.moreNesting section', false).then(function (html) {
            html.should.be.exactly('<span>bar</span>');
        });
    });

    it('should return html of multiple elements', function() {
        return this.client.getHTML('.box').then(function (html) {
            html.should.be.an.instanceOf(Array);
            html.should.have.length(5);
            html.should.containEql('<div class="box red ui-droppable" data-foundby="css selector"></div>');
            html.should.containEql('<div class="box green"></div>');
            html.should.containEql('<div class="box yellow"></div>');
            html.should.containEql('<div class="box black"></div>');
            html.should.containEql('<div class="box purple" id="purplebox" data-foundby="id"></div>');
        });
    });

});