// example of webdriver with queued commands

var webdriverjs = require("webdriverjs");
//var client = webdriverjs.remote("172.16.135.132");
var client = webdriverjs.remote();
client
	.testMode()
	.init()
	.url("http://ozzo.local/webdriver/www/")
	.tests.cssPropertyEquals("#tjena", "color", "#000000", "Color of #tjena is #000000")
	.tests.titleEquals("Foo", "Title of the page is 'Foo'")
	.tests.visible("#sign", false, "#sign is not visible before click")
	.click("#submit")
	.tests.visible("#sign", true, "#sign is visible after click")
	.end();	


