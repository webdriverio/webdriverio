module.exports = function getOrientation (callback) {

    if(arguments.length !== 1 || typeof callback !== 'function') {
        return typeof callback === 'function' ? callback(new Error('number or type of arguments don\'t agree with setOrientation command')) : false;
    }

    this.orientation(function(err, res) {

        callback(err,res.value);

    });

};

