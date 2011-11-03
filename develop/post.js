var http = require("http");

var request = http.request({
		method: "POST",
		host: "192.168.5.6",
		port: 4444,
		path: "/wd/hub/session",
		headers: {
			'content-type': 'application/json',
			'charset': 'charset=UTF-8'
		}
	}, function(response)
	{
		var data = "";
		response.on("data",
			function(chunk)
			{
				data += chunk;
			}
		);
		
		response.on("end", 
			function()
			{
				console.log();
				console.log(data.replace(/,/gi, ",\n").substring(0,500));
				console.log();
			}
		);
		
	}
);

request.write(
	JSON.stringify({desiredCapabilities:{
		browserName: "firefox",
		version: "",
		javascriptEnabled: true,
		platform: "ANY",
	}})
)
request.end();
