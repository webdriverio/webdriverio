exports.command = function(cssSelector, callback) {
    var self = this;
    this.element("css selector", cssSelector, function(err,result){

        if(err === null && result.value){

            self.moveTo(result.value.ELEMENT, function(err,result){

                if(err === null) {

                    self.buttonDown(function(){

                        if(err === null) {

                            self.buttonUp(function(err,result){
                                if (typeof callback === "function"){
                                    callback(err,result);
                                }
                            });

                        } else {
                            callback(err, result);
                        }

                    });

                } else {
                    callback(err, result);
                }
            });

        } else {

            if (typeof callback === "function"){
                callback(err, result);
            }

        }
    });
};