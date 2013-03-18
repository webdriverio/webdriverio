var http = require("http");



exports.command = function(callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/window_handles",
		method: "GET"
	}
	
	var data = {};
		
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponse(callback), 
		data
	);
};