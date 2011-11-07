// this isnt done
exports.command = function(username, password, callback) 
{
	var self = this;
	var startTimer = new Date().getTime();
	var waitForMilliseconds = 5000;
	var handles = [];
	var orgHandler = "";
	var currentHandler = 0;
	
	// waits for more than one window
	function waitForFBWindow()
	{
		self.windowHandles(
			function(result)
			{
				var now = new Date().getTime();
				
				if (result.value.length > 1)
				{	
					handles = result.value;
					orgHandler = handles[0];
					getCorrectWindow();
				}
				else
				{
					if (now - startTimer < waitForMilliseconds)
					{
						setTimeout(waitForFBWindow, 500);
					}
					else if (typeof callback === "function")
					{
						callback({error: true, message: "got only one window"});
					}
				}
			}
		);
	}

	// when done, get the window with the correct name
	function getCorrectWindow()
	{
		//console.log(handles.length)
		if (handles.length > 0)
		{
			var handleToUse = handles.pop();
			self.window(handleToUse,
				function()
				{
					self.getTitle(
						function(result)
						{
							if (result == "Facebook")
							{
								tryToLogin();
							}
							else
							{
								getCorrectWindow();
							}
						}
					);
				}
			);
		}
		else
		{
			if (typeof callback === "function")
			{
				callback({error: true, message: "couldnt find login window"});
			}
		}
	}
	
	// try to fill the form
	function tryToLogin()
	{

		self
			.setValue("#username", username)
			.setValue("#password", password)
			.click("#submit")
			.window(orgHandler, function(result)
				{
					if (typeof callback === "function")
					{
						callback({error: false});
					}
				}
			);
			

	/*	self.setValue("#username", username,
			function(result)
			{
				self.setValue("#password", password,
					function(result)
					{
						self.click("#submit", function(result)
							{
								if (typeof callback === "function")
								{
									callback({error: false});
								}
							}
						);
					}
				);
			}
		);
		
	*/	
	}
	
	waitForFBWindow();
	
	
};

