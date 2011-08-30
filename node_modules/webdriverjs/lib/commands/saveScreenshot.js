exports.command = function(fileName, callback) 
{
	var self = this;
	self.screenshot(
		function(result)
		{
			if (result.status == 0)
			{
				self.saveScreenshotToFile(fileName, result.value);
				if (typeof callback === "function")
				{
					callback(result);
				}
			}
			else
			{
				if (typeof callback === "function")
				{
					callback(result);
				}
			}
		}
	);
};

