exports.command = function(cssSelectorItem, cssSelectorDropDestination, callback) {

    var self = this;

    this
        .moveToObject(cssSelectorItem)
        .buttonDown()
        .moveToObject(cssSelectorDropDestination)
        .buttonUp(function(err,result) {
        if (typeof callback === "function") {
            callback(err,result);
        }
    });

};
