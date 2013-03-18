var http = require("http");

exports.command = function(id, callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/name",
		method: "GET"
	};
	
	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
	
	var data = {};

	this.executeProtocolCommand(
		requestOptions, 
		this.proxyResponse(callback), 
		data
	);
};
