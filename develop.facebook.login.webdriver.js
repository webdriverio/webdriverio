// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init()
	.url("http://localhost")
	.facebookLogin("xxx@xxx.com", "xxx")
	//.end();	
