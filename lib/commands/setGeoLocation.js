module.exports = function setGeoLocation (location, callback) {

    if(typeof location !== 'object' || !location.latitude || !location.longitude || !location.altitude) {
        return callback(new Error('location object need to have a latitude, longitude and altitude attribute'));
    }

    this.location(location, function(err, res) {

        if(typeof callback === 'function') {

            callback(err,res);

        }

    });

};

