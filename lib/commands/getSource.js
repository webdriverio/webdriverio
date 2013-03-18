exports.command = function(callback)
{
	this.source(
		function(result)
		{
			if (result.status == 0)
			{
				if (typeof callback === "function")
				{
					callback(result.value);
				}
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
