var http = require("http");

exports.command = function(id, attributeName, callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/attribute/:name",
		method: "GET"
	};
	
	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
	requestOptions.path = requestOptions.path.replace(":name", attributeName);
	
	var data = {};

	this.executeProtocolCommand(
		requestOptions, 
		this.proxyResponse(callback), 
		data
	);
};
