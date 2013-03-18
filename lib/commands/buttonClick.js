exports.command = function(cssSelector, callback) 
{
	var self = this;
	self.element("css selector", cssSelector, function(result){
		if (result.status == 0){
			self.moveTo(result.value.ELEMENT, function(result){
				self.buttonDown(function(){
					self.buttonUp(function(){
						if (typeof callback === "function"){
							callback();
						}
					})
				})
			});
		}else{
			if (typeof callback === "function"){
				callback(result);
			}
		}
	});
};



