var http = require("http");

exports.command = function(id, cssProperyName, callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/css/:propertyName",
		method: "GET"
	};
	
	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
	requestOptions.path = requestOptions.path.replace(":propertyName", cssProperyName);
	
	var data = {};

	this.executeProtocolCommand(
		requestOptions, 
		this.proxyResponse(callback), 
		data
	);
};
