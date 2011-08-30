// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("http://ozzo.local/webdriver/www/index2.html")
	.getSize("#tjena", function(result){ /*console.log(result); */ })
	.getCssProperty("#tjena", "color", function(result){ /*console.log(result); */ })
	.getTitle(
		function()
		{	
			client.url("http://ozzo.local/webdriver/www/index.html");
		}
	)
	.pause(1000)
	.isVisible("#sign")
	.getCssProperty("#sign", "display", function(result){ /*console.log(result); */ })
	.click("#submit")
	.getCssProperty("#sign", "display", function(result){ /*console.log(result); */ })
	.waitFor("#datamaskin", 10000, function(foundIt)
		{
		//	console.log("FOUND ", foundIt)
		}
	)
	.isVisible("#sign")
	.getTitle()
	.end();	
