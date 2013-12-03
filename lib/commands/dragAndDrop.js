module.exports = function dragAndDrop (cssSelectorItem, cssSelectorDropDestination, callback) {

    var self = this;

    this
        .moveToObject(cssSelectorItem)
        .buttonDown()
        .moveToObject(cssSelectorDropDestination)
        .buttonUp(callback);

};
