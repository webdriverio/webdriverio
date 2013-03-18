var http = require("http");

exports.command = function(id, using, value, callback) 
{
	
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/element",
		method: "POST"
	};
	
	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);

	var self = this;
	var data;
	
	var check = /class name|css selector|id|name|link text|partial link text|tag name|xpath/gi;
	if (!using.match(check))
	{
		throw "Please provide any of the following using strings as the first parameter: class name, css selector, id, name, link text, partial link text, tag name or xpath";
	}
	
	var data =  {"using": using, "value": value};
	
	this.executeProtocolCommand(
		requestOptions, 
		self.proxyResponse(callback), 
		data
	);
	

};