module.exports = function getOrientation (callback) {

    var self = this;

    if(arguments.length !== 1 || typeof callback !== 'function') {
        throw 'number or type of arguments don\'t agree with setOrientation command';
    }

    this.orientation(function(err, res) {

        callback(err,res.value);

    });

};

