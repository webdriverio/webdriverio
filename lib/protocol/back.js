exports.command = function(callback)
{
	var commandOptions =  {
		path: "/session/:sessionId/back",
		method: "POST"
	}

	this.executeProtocolCommand(
		commandOptions,
		this.proxyResponseNoReturn(callback),
        {}
	);
};
