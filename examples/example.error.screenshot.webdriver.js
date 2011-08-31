// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();
var fs = require('fs');

client
	.init()
	.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/popupopener.html")
	.getSize("#fkjfj")
	.end();	
