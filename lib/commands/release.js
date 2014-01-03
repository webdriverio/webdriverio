module.exports = function release (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {
        throw 'release command is not supported on non mobile platforms';
    }

    this.getLocation(selector, function(err,res) {

        if(err === null && res) {
        
            this.touchUp(res.x,res.y,callback);

        } else {

            callback(err,res);

        }

    });

};