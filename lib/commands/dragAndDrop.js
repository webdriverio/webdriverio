exports.command = function(cssSelectorItem, cssSelectorDropDestination, callback) {

    var self = this;

    this.moveToObject(cssSelectorItem);
    this.buttonDown();
    this.moveToObject(cssSelectorDropDestination);
    this.buttonUp(function() {
        if (typeof callback === "function") {
            callback();
        }
    });

};
