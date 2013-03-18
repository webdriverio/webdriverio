var http = require("http");
exports.command = function(id, keys, callback)
{
	var commandOptions =  {
		path: "/session/:sessionId/element/:id/value",
		method: "POST"
	};

	var requestOptions = commandOptions;
	requestOptions.path = requestOptions.path.replace(/:id/gi, id);

	var data = {"value" : keys};

	this.executeProtocolCommand(
		requestOptions,
		this.proxyResponseNoReturn(callback),
		data
	);
};
