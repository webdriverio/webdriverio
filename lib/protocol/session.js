var http = require("http");



exports.command = function(doWhat, callback) 
{
	var commandOptionsGet =  {
		path: "/session/:sessionId",
		method: "GET"
	}

	var commandOptionsDelete =  {
		path: "/session/:sessionId",
		method: "DELETE"
	}
	
	var self = this;
	var options, request;
	
	if (typeof doWhat == "function")
	{
		callback = doWhat;
		doWhat = "get";
	}


	// set
	if (doWhat.toLowerCase() === "get")
	{
        this.executeProtocolCommand( commandOptionsGet, self.proxyResponse(callback), {});
	}
	else if (doWhat.toLowerCase() === "delete")
	{
		request = this.createRequest(commandOptionsDelete, 
			function()
			{
				// all this is done dor the sake of having one more extrerow in the console when done
				if (typeof callback === "function")
				{
					callback();
				}
				console.log("");
			}
		);
        var data = JSON.stringify({});
        request.write(data);
        request.end();
		
	}
	else
	{
		throw "The session command need either a 'delete' or 'get' attribute to know what to do. example: client.session('get', callback) to get the capabilities of the session.";
		return;
	}
	

};
