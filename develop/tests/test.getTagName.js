var assert = require("assert");
var client = require("webdriverjs").remote();

client
   .init()
   .url("http://localhost/projects/webdriverjs-testsite")
   .getTagName("#sign", function(result) {
		assert.equal(result, "div", "The #sign should be a DIV");
	})
   .end();


