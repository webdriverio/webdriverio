var assert = require("assert");
var client = require("webdriverjs").remote();

client
    .init()
    .url("http://localhost/projects/webdriverjs-testsite")
    .dragAndDrop("#item1", "#dropContainer")
    .getText("#dropContainer #item1", function(result) {
        assert.equal(result.value, "item 1");
    })
    .end();

