var assert = require("assert");
var client = require("webdriverjs").remote();

client
   	.init()
   	.url("http://localhost/projects/webdriverjs-testsite")
   	.getLocationInView("#extra", function(result) {
		//console.log(result)
		assert.equal(result.x, 300, "Correct x value");
		assert.equal(result.y, 0, "Correct x value");
	})
   	.end();

