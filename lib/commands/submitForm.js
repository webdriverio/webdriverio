exports.command = function(cssSelector, callback) 
{
	var self = this;
	self.element("css selector", cssSelector,
		function(result)
		{
			if (result.status == 0)
			{
				self.submit(result.value.ELEMENT,
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

