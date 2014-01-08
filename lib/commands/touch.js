module.exports = function touch (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {
        throw 'touch command is not supported on non mobile platforms';
    }

    this.getLocation(selector, function(err,res) {

        if(err === null && res) {
        
            this.touchDown(res.x,res.y,callback);

        } else {

            callback(err,res);

        }

    });

};