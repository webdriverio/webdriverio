

exports.command = function(url, callback) 
{
	
	var commandOptionsPost =  {
		path: "/session/:sessionId/url",
		method: "POST"
	}

	var commandOptionsGet =  {
		path: "/session/:sessionId/url",
		method: "GET"
	}
	
	var self = this;
	var data;

	// set
	if (typeof url === "string")
	{
	//	request = this.createRequest(this.createOptions(commandOptionsPost), this.proxyResponseNoReturn(callback));
		data = {"url": url};
		this.executeProtocolCommand(
			commandOptionsPost, 
			self.proxyResponseNoReturn(callback), 
			data
		);
	}
	
	// get
	else
	{
		callback = url;
		//request = this.createRequest(this.createOptions(commandOptionsGet), this.proxyResponse(callback));
		data = {};
		this.executeProtocolCommand(
			commandOptionsGet, 
			self.proxyResponse(callback), 
			data
		);
	}
	
/*	request.write(data);
	request.end();
	
	
	var data = JSON.stringify({});

	this.executeProtocolCommand(
		requestOptions, 
		this.proxyResponse(callback), 
		data
	);
	*/
};

