var http = require("http");



exports.command = function(frameId, callback) 
{
	
	var commandOptions =  {
		path: "/session/:sessionId/frame",
		method: "POST"
	}
	
	if (arguments.length == 1)
	{
		callback = frameId;
		frameId = null;
		data= {};
	}
	var data = {"id": frameId};
		
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponseNoReturn(callback), 
		data
	);
};