// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("http://ozzo.local/webdriver/www/")
	.getElementSize("id", "tjena", function(result){ /*console.log(result); */ })
	.getTitle()
	.getElementCssProperty("id", "tjena", "color", function(result){ /*console.log(result); */ })
	.end();	




