Webdriver/selenium 2.0 javascript bindings for nodejs
===

### Example of webdriver with queued commands localy:

Run selenium server first:  
	
	java -jar selenium-server-standalone-2.5.0.jar
	
Then run this with nodjs:

	var webdriverjs = require("webdriverjs");
	var client = webdriverjs.remote();
	//var client = webdriverjs.remote("xx.xx.xx.xx"); // to run it on a remote selenium server

	client
		.init()
		.url("https://github.com/")
		.getElementSize("id", "header", function(result){ console.log(result);  })
		.getTitle()
		.getElementCssProperty("id", "header", "color", function(result){ console.log(result);  })
		.end();	


### Example of using webdriverjs for testing localy

Run selenium server first:  
	
	java -jar selenium-server-standalone-2.5.0.jar
	
Then run this with nodjs:

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


# FAQ

###Which protocol parts are done?
Well, not all of them but a couple and more to come.

###Are there more things than "just the protocol"?
Yes, the implementation is done so that more complicated sets of protocol elements can be chained. I will explain more about this soon

# More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)