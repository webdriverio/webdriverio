// example of webdriver with queued commands, callaback commands and other stuff

var webdriverjs = require("webdriverjs");
var client = webdriverjs.remote();


client.init();
client.url("http://www.onezerozeroone.com/projects/webdriverjs/testsite/", function() {});
client.url(function(result) { /*console.log("URL:", result.value); */});
client.execute("return document.title", function(result) { /*console.log("document.title:", result.value);*/ });	
client.title(function(result) { /*console.log("URL:", result.value); */});

client.element("id", "foo", function(result) { 
	
	client.elementIdCssProperty(result.value.ELEMENT, "color", function(result) { /*console.log("element width id 'hoz':", result.value); */});	
	client.elementIdSize(result.value.ELEMENT, function(result) { /*console.log(result.value); */});
	client.elementIdDisplayed(result.value.ELEMENT, function(result) { /*console.log(result.value); */});
	client.elements("tag name", "script", function(result) { /*console.log(result);*/ });
	client.value(result.value.ELEMENT, "Data", function(result) { /*console.log(result);*/ });
	client.value(result.value.ELEMENT, function(result) { /*console.log(result);*/ });
	client.screenshot(function(result) { /*console.log("element width id 'hoz':", result.value); */});	
	client.session("delete");	
	
});


