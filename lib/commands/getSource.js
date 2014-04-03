module.exports = function getSource (callback) {

    this.source(function(err,result) {

        if (err === null) {

            callback(err,result.value);

        } else {

            /* istanbul ignore next */
            callback(err, result);

        }

    });
};
