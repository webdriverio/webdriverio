// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();
var fs = require('fs');

client
	.init()
	.url("http://ozzo.local/webdriver/www/popupopener.html")
	.getSize("#fkjfj")
	.end();	
