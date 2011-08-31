// example of webdriver with mixed commands.
// some are chained, some are inside the callbacks.

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();

client
	.init() // initiate the client
	.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/index2.html") // go to a specific url
	.getSize("#foo", function(result){ /*console.log(result); */ }) // get the width and hight of an element with the id #foo
	.getCssProperty("#foo", "color", function(result){ /*console.log(result); */ }) // get the color css property for an object with the id #foo
	.getTitle( // get the title of the page and when its done go to a new url
		function()
		{	
			client.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/index.html");
		}
	)
	.pause(1000) // pause for 1 sec
	.isVisible("#sign") // check if an elemnt with the id #sign is visible
	.getCssProperty("#sign", "display", function(result){ /*console.log(result); */ })
	.click("#submit")
	.getCssProperty("#sign", "display", function(result){ /*console.log(result); */ })
	//.waitFor("#datamaskin", 10000, function(foundIt)
	//	{
		//	console.log("FOUND ", foundIt)
	//	}
	//)
	.isVisible("#sign")
	.getTitle()
	.end();	
