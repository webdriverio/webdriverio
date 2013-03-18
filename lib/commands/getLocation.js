exports.command = function(cssSelector, callback) 
{
	var self = this;
	
	self.element("css selector", cssSelector,
		function(result)
		{
			if (result.status == 0)
			{
				self.elementIdLocation(result.value.ELEMENT, 
					function(result)
					{
						if (typeof callback === "function")
						{
							callback({x:result.value.x, y: result.value.y});
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

