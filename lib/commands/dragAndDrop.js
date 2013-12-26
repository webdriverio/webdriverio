module.exports = function dragAndDrop (cssSelectorItem, cssSelectorDropDestination, callback) {

    this
        .moveToObject(cssSelectorItem)
        .buttonDown()
        .moveToObject(cssSelectorDropDestination)
        .buttonUp(callback);

};
