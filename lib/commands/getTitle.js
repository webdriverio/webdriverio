module.exports = function getTitle (callback) {
    this.title(function(err, result) {

        if(err === null) {

            callback(err, result.value);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }
    });
};

