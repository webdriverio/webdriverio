module.exports = function release (selector, callback) {

    var isMobile = require('../helpers/isMobile')(this.desiredCapabilities);

    if(!isMobile) {
        return typeof callback === 'function' ? callback(new Error('release command is not supported on non mobile platforms')) : false;
    }

    this.getLocation(selector, function(err,res) {

        if(err === null && res) {
        
            this.touchUp(res.x,res.y,callback);

        } else {

            /* istanbul ignore next */
            callback(err,res);

        }

    });

};