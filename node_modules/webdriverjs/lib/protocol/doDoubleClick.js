var http = require("http");
exports.command = function(callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/doubleclick",
		method: "POST"
	};
	
	var requestOptions = commandOptions;

	var data = {};
		
	this.executeProtocolCommand(
		requestOptions, 
		this.proxyResponseNoReturn(callback), 
		data
	);
};
