var http = require("http");

exports.command = function(callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/title",
		method: "GET"
	}
	
	
	var data = {};
		
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponse(callback), 
		data
	);
};