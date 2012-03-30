exports.command = function(callback)
{
	var commandOptions =  {
		path: "/session/:sessionId/forward",
		method: "POST"
	}

	this.executeProtocolCommand(
		commandOptions,
		this.proxyResponseNoReturn(callback),
        {}
	);
};
