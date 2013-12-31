module.exports = function setOrientation (orientation, callback) {

    var self = this;

    if(arguments.length !== 2 || typeof orientation !== 'string') {
        throw 'number or type of arguments don\'t agree with setOrientation command';
    }

    this.orientation(orientation.toUpperCase(), function(err, res) {

        if(typeof callback === 'function') {

            callback(err,res);

        }

    });

};

