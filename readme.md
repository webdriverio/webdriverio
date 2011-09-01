Webdriver/selenium 2.0 javascript bindings for nodejs
===

A set of protocol bindings for webdriver trough nodejs.
It is written so its easy to add new protocol implementations and add helper commands so make testing easier. each command resides as one file inside the node module folder which makes it easy to extend.

The two main reasons for this projects are: 

1) Ease of use - Writing tests with webdriver should be very easy

2) Easy to extend - Adding helper functions, or more complicated sets and combinations of existing commands, should also be very easy.

### Example of webdriver with queued commands locally:

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


### Example of using webdriverjs for testing locally

Run selenium server first:  
	
	java -jar selenium-server-standalone-2.5.0.jar
	
Then run this with nodjs:

	var webdriverjs = require("webdriverjs");
	var client = webdriverjs.remote();

	client
		.testMode()
		.init()
		.url("https://github.com")
		.tests.cssPropertyEquals(".login a", "color", "#4183c4", "Color of .login a is #4183c4")
		.tests.titleEquals("Secure source code hosting and collaborative development - GitHub", "Title of the page is 'Secure source code hosting and collaborative development - GitHub'")
		.click(".pricing a")
		.tests.titleEquals("Plans & Pricing - GitHub", "Title of the page is 'Plans & Pricing - GitHub'")
		.tests.visible(".pagehead", true, ".pagehead is visible after click")
		.end();	

More examples in the examples folder

# FAQ

###Which protocol parts are done?
Well, not all of them but a couple and more to come.

###Are there more things than "just the protocol"?
Yes, the implementation is done so that more complicated sets of protocol elements can be chained. I will explain more about this soon

# More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)