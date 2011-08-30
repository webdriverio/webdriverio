// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("https://www.supremecard.se/ansok/ansok.jsp")
	.saveScreenshot("test.png")
	.end();	
