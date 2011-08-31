// example of webdriver with queued commands in test mode 

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.testMode()
	.init()
	.url("https://github.com")
	.tests.cssPropertyEquals(".login a", "color", "#4183c4", "Color of #tjena is #4183c4")
	.tests.titleEquals("Secure source code hosting and collaborative development - GitHub", "Title of the page is 'Secure source code hosting and collaborative development - GitHub'")
	.click(".pricing a")
	.tests.titleEquals("Plans & Pricing - GitHub", "Title of the page is 'Plans & Pricing - GitHub'")
	.tests.visible(".pagehead", true, ".pagehead is visible after click")
	.end();	


