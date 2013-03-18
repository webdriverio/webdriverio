var http = require("http");

exports.command = function(id, callback) 
{
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/size",
		method: "GET"
	};
	
	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
	
	var request = this.createRequest(requestOptions, this.proxyResponse(callback));
	var data = JSON.stringify({});
	request.write(data);
	request.end();
};
