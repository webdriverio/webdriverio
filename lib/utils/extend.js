/**
 * a basic extend method
 *
 * @param  {Object} base  base object which gets extended
 * @param  {Object} obj   additonal object which extend the base object
 */
module.exports = function(base, obj) {
    var newObj = {};

    for(var prop1 in base) {
        newObj[prop1] = base[prop1];
    }

    for(var prop2 in obj) {
        newObj[prop2] = obj[prop2];
    }

    return newObj;
};