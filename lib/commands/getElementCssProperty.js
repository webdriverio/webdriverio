exports.command = function(using, value, cssProperty, callback) 
{
	var self = this;
	self.element(using, value,
		function(result)
		{
			if (result.status == 0)
			{
				self.elementIdCssProperty(result.value.ELEMENT, cssProperty,
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
					callback(result);
				}
			}
		}
	);
	
};

