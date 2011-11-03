var http = require("http");


exports.command = function(using, value, callback) 
{
	
	var commandOptions =  {
		path: "/session/:sessionId/elements",
		method: "POST"
	};
	
	var check = /class name|css selector|id|name|link text|partial link text|tag name|xpath/gi;
	if (!using.match(check))
	{
		throw "Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath";
	}
	
	var data =  {"using": using, "value": value};
	
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponse(callback), 
		data
	);

};