// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/popupopener.html")
	.assert.textContains("h1", "tjena", 
		function(err)
		{
			console.log("err = ", err);
		}
	)
	.end();	
