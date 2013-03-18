var http = require("http");

exports.command = function(id, callback) 
{

	var commandOptionsPost =  {
		path: "/session/:sessionId/element/:id/clear",
		method: "POST"
	};
	
	var self = this;

	var requestOptions = commandOptionsPost;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);
		
	var data = {};
		
	self.executeProtocolCommand(
		requestOptions, 
		this.proxyResponseNoReturn(callback), 
		data
	);
	
};
