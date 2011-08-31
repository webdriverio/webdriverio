// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("www.onezerozeroone.com/projects/webdriverjs/testsite/popupopener.html")
	.click("#submit")
	.end();	
