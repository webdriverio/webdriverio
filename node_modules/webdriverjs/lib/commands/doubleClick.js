exports.command = function(cssSelector, callback) 
{
	var self = this;
	
	self.moveToObject(cssSelector);
	self.element("css selector", cssSelector,
		function(result)
		{
			if (result.status == 0)
			{
				self.doDoubleClick( 
					function(result)
					{
						if (typeof callback === "function")
						{
							callback();
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

