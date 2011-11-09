var assert = require("assert");
var client = require("webdriverjs").remote();

// test if it works to add new commands
client.addCommand("myCommand", function(callback) {
	this.url(
		function(result1)
		{
			this.getTitle(
				function(result2)
				{
					var specialResult = {url: result1.value, title: result2};
					if (typeof callback == "function")
					{
						callback(specialResult);
					}
				}
			)
		}
	);
});

client
   	.init()
   	.url("http://localhost/projects/webdriverjs-testsite")
   	.myCommand(function(result)
	{
		assert.equal(result.url, "http://localhost/projects/webdriverjs-testsite/", "Correct url");
		assert.equal(result.title, "Foo", "Correct title");
	})
   	.end();

