exports.command = function(fileName, callback)
{
	var self = this;
	self.screenshot(
		function(result)
		{
			if (result.status == 0)
			{
				return self.saveScreenshotToFile(fileName, result.value, callback);
			}
			if(callback) callback(result);
		}
	);
};

