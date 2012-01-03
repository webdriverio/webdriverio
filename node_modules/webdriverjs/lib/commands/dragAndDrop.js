exports.command = function(cssSelectorItem, cssSelectorDropDestination, callback) 
{
	var self = this;
	
    self.moveToObject(cssSelectorItem)
    self.buttonDown()
    self.moveToObject(cssSelectorDropDestination)
    self.buttonUp(
        function()
		{
			if (typeof callback === "function")
			{
				callback();
		    }
		}
    )
 
};
