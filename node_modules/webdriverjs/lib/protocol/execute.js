var http = require("http");


exports.command = function(script, callback) 
{
	
	var commandOptions =  {
		path: "/session/:sessionId/execute",
		method: "POST"
	}
	
	var data = {"script": script, args: []};
	
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponse(callback), 
		data
	);
	
};

