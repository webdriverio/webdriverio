// this isnt done yet

exports.command = function(cssSelector, value, callback) 
{
	var self = this;
	self.element("css selector", cssSelector,
		function(result)
		{
			if (result.status == 0)
			{
				self.elementIdValue(result.value.ELEMENT, value,
					function(result)
					{
						if (typeof callback === "function")
						{
							callback(result);
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

