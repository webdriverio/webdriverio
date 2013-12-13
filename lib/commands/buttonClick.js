module.exports = function buttonClick (cssSelector, callback) {
    var self = this;
    this.element(cssSelector, function(err,result){

        if(err === null && result.value){

            self.moveTo(result.value.ELEMENT, function(err,result){

                if(err === null) {

                    self.buttonDown(function(){

                        if(err === null) {

                            self.buttonUp(callback);

                        } else {
                            callback(err, result);
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
};