exports.command = function(cssSelector, expected, callback) 
{
	var self = this;
	self.getText(cssSelector,
		function(result)
		{
			if (result.value.indexOf(expected) != -1)
			{
				//theTest, receivedValue, expectedValue, message
				self.showTest(result.value === expected, result.value, expected, "Asserting result:`"+result.value+"` is as expected");
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

