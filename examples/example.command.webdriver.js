// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/")
	.getElementSize("id", "foo", function(result){ /*console.log(result); */ })
	.getTitle()
	.getElementCssProperty("id", "foo", "color", function(result){ /*console.log(result); */ })
	.end();	




