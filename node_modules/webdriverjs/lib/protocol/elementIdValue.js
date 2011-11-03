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

	// set
	if (typeof value === "string")
	{
		var requestOptions = commandOptionsPost;
		requestOptions.path = requestOptions.path.replace(/:id/gi, id);
		var data = {"value": value.split("")};
		
		self.executeProtocolCommand(
			requestOptions, 
			this.proxyResponseNoReturn(callback), 
			data
		);
	}
	
	// get
	else
	{
		callback = value;
		var data = {};
		
		var requestOptions = commandOptionsGet;
		requestOptions.path = requestOptions.path.replace(/:id/gi, id);
		
		self.executeProtocolCommand(
			requestOptions, 
			this.proxyResponse(callback), 
			data
		);
	}
	
};
