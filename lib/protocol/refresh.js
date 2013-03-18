exports.command = function(callback)
{
	var commandOptions =  {
		path: "/session/:sessionId/refresh",
		method: "POST"
	}

	this.executeProtocolCommand(
		commandOptions,
		this.proxyResponseNoReturn(callback),
        {}
	);
};
