exports.command = function(callback)
{
	var commandOptions =  {
		path: "/session/:sessionId/source",
		method: "GET"
	}

	this.executeProtocolCommand(
		commandOptions,
		this.proxyResponse(callback),
        {}
	);
};
