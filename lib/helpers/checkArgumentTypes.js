/**
 * check if arguments are having the expected type
 *
 * @param  {Array}   args           passed arguments
 * @param  {Array}   expectedTypes  expected type
 * @return {Boolean}                true if type of arguments matching with giving type list
 */

module.export = function(args,expectedTypes) {

    var isMatching = true;

    expectedTypes.forEach(function(expectedType,i) {

        if(typeof args[i] !== expectedType) {
            isMatching = false;
            return;
        }

    });

    return isMatching;

};