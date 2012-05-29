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
	
Then run this with nodejs:

	var webdriverjs = require("webdriverjs");
	var client = webdriverjs.remote();
	//var client = webdriverjs.remote({host: "xx.xx.xx.xx"}); // to run it on a remote webdriver/selenium server
	//var client = webdriverjs.remote({desiredCapabilities:{browserName:"chrome"}}); // to run in chrome

	client
		.init()
		.url("https://github.com/")
		.getElementSize("id", "header", function(result){ console.log(result);  })
		.getTitle(function(title) { console.log(title) })
		.getElementCssProperty("id", "header", "color", function(result){ console.log(result);  })
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

	var client = require("webdriverjs").remote({logLevel: 'silent'}); // if you use it as part of other app and the logs arent interesting

	client
		.init()
		.url("https://github.com/")
		.getTitle(
			function(result)
			{
				console.log(result)
			}
		)
	    .end();

### Extending
If you want to extend with your own set of commands there is a method called addCommand:

	var client = require("webdriverjs").remote();

	// create a command the returns the current url and title as one result (just to show an example)
	client.addCommand("getUrlAndTitle", function(callback) {
		this.url(
			function(urlResult)
			{
				this.getTitle(
					function(titleResult)
					{
						var specialResult = {url: urlResult.value, title: titleResult};
						if (typeof callback == "function")
						{
							callback(specialResult);
						}
					}
				)
			}
		);
	});

	client
	   	.init()
	   	.url("http://www.google.com")
	   	.getUrlAndTitle(function(result)
		{
			console.log(result);
		})
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

# List of current helper methods
These are the current implemented helper methods. All methods take from 0 to a couple of parameters. Also all methods accept a callback so that we can assert values or have more logic when the callback is called.

- dragAndDrop(sourceCssSelector, destinationCssSelector, [callback]) - Drags an item to a destination
- click(css selector, [callback]) - Clicks on an element based on a css selector
- doubleClick(css selector, [callback]) - Clicks on an element based on a css selector
- end([callback]) - Ends a sessions (closes the browser)
- getAttribute(css selector, attribute name, [callback]) - Get an attribute from an dom obj based on the css selector and attribute name
- getCssProperty(css selector, css property name, [callback]) - Gets a css property from a dom object selected with a css selector
- getElementCssProperty(find by, finder, css property name, [callback]) - Gets a css property from a dom object selected with one of the base selecting mechanisms in the webdriver protocol (class name, css selector, id, name, link text, partial link text, tag name, xpath)
- getElementSize(css selector, [callback]) - Get the elements size. The element is found with a css selector
- getLocation(css selector, [callback]) - Gets the x and y coordinate for an object based on the css selector
- getLocationInView(css selector, [callback]) - Gets the x and y coordinate for an object based on the css selector in the view
- getSize(css selector, [callback]) - Gets the width and height for an object based on the css selector
- getText(css selector, [callback]) - Gets the text content from a dom obj found by the css selector
- getTagName(css selector, [callback]) - Gets the tag name of a dom obj found by the css selector
- getTitle([callback]) - Gets the title of the page
- getSource([callback]) - Gets source code of the page
- getValue(css selector, [callback]) - Gets the value of a dom obj found by css selector
- isVisible(css selector, [callback]) - Return true or false if the selected dom obj is visible (found by css selector)
- isSelected(css selector, [callback]) - Return true or false if an OPTION element, or an INPUT element of type checkbox or radiobutton is currently selected (found by css selector).
- moveToObject(css selector, [callback]) - Moves the page to the selected dom object
- pause(milliseconds, [callback]) - Pauses the commands by the provided milliseconds
- saveScreenshot(path to file, [callback]) - Saves a screenshot as a png from the current state of the browser
- setValue(css selector, value, [callback]) - Sets a value to an object found by a css selector
- submitForm(css selector, [callback]) - Submits a form found by the css selector
- waitFor(css selector, milliseconds, [callback]) - Waits for an object in the dom (selected by css selector) for the amount of milliseconds provided. the callback is called with false if the object isnt found.
- buttonClick(css selector, [callback]) - click on a button using a css selector
- clearElement(css selector, [callback]) - clear an element of text

# List of current implemented wire protocol bindings
Here are the implemented bindings (and links to the official json protocol binding)

- [buttondown](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttondown)
- [buttonup](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/buttonup)
- [element](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element)
- [elementIdAttribute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/attribute/:name)
- [elementIdClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/click)
- [elementDoubleClick](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/doubleclick)
- [elementIdCssProperty](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/css/:propertyName)
- [elementIdDisplayed](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/displayed)
- [elementIdLocation](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/location)
- [elementIdLocationInView](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/location_in_view)
- [elementIdName](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/name)
- [elementIdSize](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/size)
- [elementIdText](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/text)
- [elementIdValue](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/value)
- [elementIdSelected](http://code.google.com/p/selenium/wiki/JsonWireProtocol#GET_/session/:sessionId/element/:id/selected)
- [elements](http://code.google.com/p/selenium/wiki/JsonWireProtocol#POST_/session/:sessionId/element/:id/elements)
- [execute](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/execute)
- [frame](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/frame)
- [init](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/)
- [moveto](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/moveto)
- [screenshot](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/screenshot)
- [session](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId)
- [status](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/status)
- [submit](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/element/:id/submit)
- [title](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/title)
- [url](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url)
- [source](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/source)
- [window](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window)
- [windowHandles](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/window_handles)
- [forward](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/forward)
- [back](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/back)
- [refresh](http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/refresh)

# FAQ

### Which protocol parts are done?
Well, not all of them but a couple and more to come.

###Are there more things than "just the protocol"?
Yes, the implementation is done so that more complicated sets of protocol elements can be chained. I will explain more about this soon

###How can i send via Chrome webdriver switches to start chrome

Download chrome webdriver (last version: chromedriver_mac_20.0.1133.0.zip)
Start selenium with: 
java -jar ./selenium-server-standalone-2.21.0.jar -Dwebdriver.chrome.bin="/Applications/Google Chrome.app/Contents/MacOs/Google Chrome" -Dwebdriver.chrome.driver="/FULL_PATH_TO/chromedriver"


Send desired capabilities: 
  desiredCapabilities:{
    browserName: 'chrome',
    seleniumProtocol: 'WebDriver',
    'chrome.switches': ['--window-size=1366,768','--proxy-server=http://127.0.0.1:9091']
  }


# More on selenium and its protocol
- [Latest standalone server](http://code.google.com/p/selenium/downloads/list)
- [The protocol](http://code.google.com/p/selenium/wiki/JsonWireProtocol)

# Change log
- 2012-03-03: Added .doubleClick(cssSelector, [callback]);
- 2012-01-03: Added .dragAndDrop(sourceCssSelector, destinationCssSelector, [callback]);
- 2011-11-09: Added client.addCommand(commandName, function) to extend webdriverjs. Also merged with arcaniusx to fix conflict with colors module and waitFor response
- 2011-11-08: Bindings added: moveTo, elementIdLocationInView, elementIdName. Helper methods added: getTagName, getLocationInView, moveToObject. Also added some tests.
- 2011-11-07: Found bug that caused the incompatibility with Selenium Grid 2.
- 2011-11-05: Added suport for desiredCapabilities when calling the remote() method (only available in the init() method before).

## NPM Maintainers

The npm module for this library is maintained by:

* [Camilo Tapia](http://github.com/Camme)
* [Dan Jenkins](http://github.com/danjenkins)

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
