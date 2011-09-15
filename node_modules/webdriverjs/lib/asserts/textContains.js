exports.command = function(cssSelector, expected, callback) 
{
	var self = this;
	self.getText(cssSelector,
		function(result)
		{
			if (result.indexOf(expected) != -1)
			{
				if (typeof callback === "function")
				{
					callback(null);
				}
			}
			else
			{
				if (typeof callback === "function")
				{
					callback({message: "Expected value not in result", result: result, expected: expected});
				}
			}
		}
	);
	
};

