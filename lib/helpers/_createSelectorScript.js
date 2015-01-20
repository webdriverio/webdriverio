/**
 * Returns the script to execute in the browser, in string format.
 * @param {Function|String} fn - function to execute in the browser
 * @param {Array.<String>} selectors - the selectors to resolve and pass to fn, each in its own array
 * @param {Array} args - the arguments to pass to fn (after resolved selectors)
 * @param {Function} callback
 * @returns {string}
 */

var findStrategy = require('./find-element-strategy');

module.exports = function(fn, selectors, args, callback) {
    var strArgs = [],
        foundSel = [],
        val;

    if (typeof fn === "function" || (this.inMultibrowserMode && fn.indexOf('function (') === 0)) {
        // Handle function script
        strArgs.push(fn.toString());
    } else if (typeof fn === "string") {
        // Handle string script
        strArgs.push('function(){' + fn + '}');
    }

    while (val = selectors.shift()) {
        // Handle selector array
        val = findStrategy([val, callback]);
        foundSel.push(val.using, val.value);
    }
    strArgs.push(JSON.stringify(foundSel));

    var i = -1;
    while (++i < args.length) {
        if (typeof args[i] === "function" || (this.inMultibrowserMode && (typeof args[i] === 'string' && args[i].indexOf('function (') === 0))) {
            args[i] =  args[i].toString();
        } else {
            args[i] = JSON.stringify(args[i]);
        }
    }
    strArgs.push('[' + args.join(',') + ']');

    return ('return (' + executeClientSide + ')(' + strArgs.join(',') + ', arguments[arguments.length - 1]);').replace(/(\s{4}|\t)+/g, ' ');
};

/**
 * Helper that resolves selectors client side and returns the result in the given fn.
 * Every resolved selector is prepended to the function's arguments.
 * Each resolved selector yields a single array.
 *
 * @param {Function} fn - the function to execute client side that will receive the resolved selectors
 * @param {Array.<String>} sArr - a series of usage, value pairs from find-element-strategy
 * @param {Array} args - any other arguments to pass to fn
 * @returns {*} the return value of fn
 * @example
 * var helper = require('./executeClientSideSelector');
 * // Execute in the browser
 * helper(fn, ['xpath', '//body', 'css', '[id="what"]'], [1, 2, 3]);
 * // Assuming fn is...
 * fn = function(xpathResult, cssResult, one, two, three) {
 *     console.log(xpathResult.length); // 1
 *     console.log(xpathResult[0]);     // <body.../>
 *     console.log(cssResult.length);   // 0
 *     console.log(one, two, three);    // 1 2 3
 * }
 */
var executeClientSide = function(fn, sArr, args) {
    var cb = arguments[arguments.length - 1],
        i = 0, sArgs = [],
        use, value, xp, cs, tn,
        res, j, arg;
    while ((use = sArr[i++]) && (value = sArr[i++])) {
        arg = [];
        xp = cs = tn = null;
        switch (use) {
            case "partial link text": xp = '//a[contains(text(),"'+value+'")]'; break;
            case "link text": xp = '//a[text()="'+value+'"]'; break;
            case "xpath": xp = value; break;
            case "id": cs = '[id="'+value+'"]'; break;
            case "name": cs = '[name="'+value+'"]'; break;
            case "tag name": tn = value; break;
            case "css selector": cs = value; break;
            default: throw new Error("Could not evaluate selector: Invalid strategy " + use);
        }

        if (xp) {
            res = document.evaluate(xp, document, null, 0, null);
            while (value = res.iterateNext()) {
                arg.push(value);
            }
        } else if (tn || cs) {
            res = tn ? document.getElementsByTagName(tn) : document.querySelectorAll(cs);
            j = 0;
            while (value = res[j++]) {
                arg.push(value);
            }
        }
        sArgs.push(arg);
    }

    var parameter = args && sArgs.concat(args) || sArgs;
    if(parameter.length === 0 || (parameter.length === 1 && parameter[0].length === 0)) {
        if(typeof cb === 'function') {
            return cb('NoSuchElement') && new Error('NoSuchElement');
        }
        return new Error('NoSuchElement');
    }

    parameter.push(arguments[arguments.length - 1]);

    return fn.apply(window, parameter);
};