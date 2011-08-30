exports.command = function(cssSelector, cssProperty, expected, message) 
{
	var self = this;
	self.getCssProperty(cssSelector, cssProperty,
		function(result)
		{
			self.showTest(result === expected, result, expected, message);
		}
	);
	
};

