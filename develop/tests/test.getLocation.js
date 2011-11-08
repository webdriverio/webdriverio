var assert = require("assert");
var client = require("webdriverjs").remote();

client
   .init()
   .url("http://localhost/projects/webdriverjs-testsite")
   .getLocation("#extra", function(result) {
		assert.equal(result.x, 300, "Correct x value");
		assert.equal(result.y, 50, "Correct x value");
	})
   .end();

