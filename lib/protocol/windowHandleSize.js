var http = require("http");

exports.command = function(opts, callback)
{

	var commandOptions =  {
		path: "/session/:sessionId/window/" +
			(opts.name || "current") +
			"/size",
		method: "POST"
	}

	var data = {
		width: opts.width,
		height: opts.height
	};

	this.executeProtocolCommand(
		commandOptions,
		this.proxyResponse(callback),
		data
	);
};
