Webdriver/selenium 2.0 javascript bindings for nodejs
===

A WebDriver module for nodejs. Either use the super easy help commands or use the base Webdriver wire protocol commands.

It is written so its easy to add new protocol implementations and add helper commands so make testing easier. each command resides as one file inside the node module folder which makes it easy to extend.

The two main reasons for this projects are: 

1) Ease of use - Writing tests with webdriver should be very easy

2) Easy to extend - Adding helper functions, or more complicated sets and combinations of existing commands, should also be very easy.

### How to install it

Either download it from github or use npm:
    
    npm install webdriverjs

### Example of webdriver with queued commands locally:

Run selenium server first:  
	
	java -jar selenium-server-standalone-2.11.0.jar
	
Then run this with nodjs:

	var webdriverjs = require("webdriverjs");
	var client = webdriverjs.remote();
	//var client = webdriverjs.remote({host: "xx.xx.xx.xx"}); // to run it on a remote webdriver/selenium server
	//var client = webdriverjs.remote({desiredCapabilities:{browserName:"chrome"}); // to run call chrome

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

### Submitting a form

To submit a form, pick any elemtn inside the form (or the form itself) and call .submitForm

    var client = require("webdriverjs").remote();

    client
         .init()
        .url("http://www.google.com")
        .setValue("#lst-ib", "webdriver")
        .submitForm("#tsf")
        .end();



More examples in the examples folder

### Other options
To make webdriverjs be silent (omit all logs):

	var client = require("webdriverjs").remote({silent: true}); // if you use it as part of other app and the logs arent interesting

	client
		.init()
		.url("https://github.com/")
		.getTitle(
			function(result)
			{
				console.log(result)
			}
		);

# FAQ

### Which protocol parts are done?
Well, not all of them but a couple and more to come.

###Are there more things than "just the protocol"?
Yes, the implementation is done so that more complicated sets of protocol elements can be chained. I will explain more about this soon

# More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)

# Change log
2011-11-07: Found bug that caused the incompatibility with Selenium Grid 2
2011-11-05: Added suport for desiredCapabilities when calling the remote() method (only available in the init() method before)

## License 

(The MIT License)

Copyright (c) 2011 Camilo Tapia &lt;camilo.tapia@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
