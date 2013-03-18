var http = require("http");

exports.command = function(windowHandle, callback) 
{
	
	var commandOptions =  {
		path: "/session/:sessionId/window",
		method: "POST"
	}


	var data = {"name": windowHandle};
		
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponseNoReturn(callback), 
		data
	);
};