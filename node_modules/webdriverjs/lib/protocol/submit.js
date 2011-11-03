var http = require("http");



exports.command = function(id, callback) 
{
	var commandOptionsGet =  {
		path: "/session/:sessionId/element/:id/submit",
		method: "POST"
	};
	
	var self = this;
	var request, data, requestOptions;

	requestOptions = commandOptionsGet;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
	request = this.createRequest(requestOptions, this.proxyResponseNoReturn(callback));
	data = JSON.stringify({});
	
	request.write(data);
	request.end();
};

