exports.command = function(expected, message) 
{
	var self = this;

	self.title(
		function(result)
		{
			self.showTest(result.value === expected, result.value, expected, message);
		}
	);
	
};

