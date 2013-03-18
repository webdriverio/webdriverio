var http = require("http");

exports.command = function(id, value, callback) 
{
	
	
	var commandOptionsPost =  {
		path: "/session/:sessionId/element/:id/value",
		method: "POST"
	};

	var commandOptionsGet =  {
		path: "/session/:sessionId/element/:id/value",
		method: "GET"
	};


	var self = this;
	var request, data, requestOptions;

	// set
	if (typeof value === "string")
	{
		requestOptions = commandOptionsPost;
		requestOptions.path = requestOptions.path.replace(/:id/gi, id);
		request = this.createRequest(requestOptions, this.proxyResponseNoReturn(callback));
		data = JSON.stringify( {"value": value.split("")} );
	}
	
	// get
	else
	{
		callback = value;
		requestOptions = commandOptionsGet;
		requestOptions.path = requestOptions.path.replace(/:id/gi, id);
		request = this.createRequest(requestOptions, this.proxyResponse(callback));
		data = JSON.stringify({});
	}
	
	request.write(data);
	request.end();
	
};

