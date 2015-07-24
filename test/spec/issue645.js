var Q = require("q");

describe('issue645', function() {

    before(h.setup({url: 'http://localhost:8080/test/site/www/table.html'}));

    it('should select cell using context of row', function(done) {
        
        this.timeout(60000);
        this.slow(5000);

        var client = this.client;

        this.client.waitForVisible("table", 5000).elements("tr").then(function(rows) {

            rows.value.forEach(function(element, idx) {
                console.log(idx, "row", element, "element");
                
                var td1 = client.elementIdElement(element.ELEMENT, "td=2015-03-02").then(function() { console.log("found date row "+idx); });
                var td2 = client.elementIdElement(element.ELEMENT, "td=12:00").then(function() { console.log("found time row "+idx); });

                Q.all([td1, td2]).then(function() {
                    console.log("found correct in row "+idx);
                },function() {
                   console.log("found nothing in row "+idx);
                });
            });
        });

    });

});