exports.command = function(cssSelector, attributeName, callback) 
{
	var self = this;

	self.element("css selector", cssSelector,
		function(result)
		{
			if (result.status == 0)
			{
				self.elementIdAttribute(result.value.ELEMENT, attributeName, 
					function(result)
					{
						if (typeof callback === "function")
						{
							callback(result.value);
						}
					}
				);
			}
			else
			{
				if (typeof callback === "function")
				{
					callback(false);
				}
			}
		}
	);
	
};

