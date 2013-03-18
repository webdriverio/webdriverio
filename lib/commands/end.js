exports.command = function(callback) 
{
	this.session("delete",
		function(result)
		{
			if (typeof callback === "function")
			{
				callback();
			}
		}
	);
};

