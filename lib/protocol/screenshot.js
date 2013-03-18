var http = require("http");


exports.command = function(callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/screenshot",
		method: "GET"
	}
	
	
	var request = this.createRequest(commandOptions, this.proxyResponse(callback));
	var data = JSON.stringify( {} );
	request.write(data);
	request.end();
};