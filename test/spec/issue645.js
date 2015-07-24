var Q = require("q");

describe.only('issue645', function() {

    before(h.setup({url: 'http://localhost:8080/test/site/www/table.html'}));

    it('should select cell using context of row', function() {

        this.timeout(60000);
        this.slow(5000);

        var client = this.client;

        return this.client.waitForVisible("table", 5000).elements("tr").then(function(rows) {

            var foundRows = [];

            rows.value.forEach(function(element, idx) {
                
                var td1 = client.elementIdElement(element.ELEMENT, "td=2015-03-02");
                var td2 = client.elementIdElement(element.ELEMENT, "td=12:00");

                var p = Q.all([td1, td2])
                    .then(function() {
                        return true;
                    }).catch(function() {
                       return false;
                    });

                foundRows.push(p);
            });

            return Q.all(foundRows).then(function(rows) {
                rows.should.be.an.instanceOf(Array);
                rows.should.have.length(2);
                rows.should.containEql(true);
                rows.should.containEql(false);
            });
        });

    });

});