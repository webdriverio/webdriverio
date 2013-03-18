var http = require("http");

exports.command = function(callback) 
{
	var commandOptions =  {
		path: "/status",
		method: "GET"
	}
	
	var data = {};
		
	this.executeProtocolCommand(
		commandOptions, 
		this.proxyResponse(callback), 
		data
	);
};