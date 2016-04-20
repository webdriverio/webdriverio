/**
 *
 * Add a value to an object found by given selector. You can also use unicode
 * characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#dfn-character-types).
 * To do that, the value has to correspond to a key from the table.
 *
 * <example>
    :addValueAsync.js
    client
        .setValue('.input', 'test')
        .addValue('.input', '123')
        .getValue('.input').then(function(value) {
            assert(err === null);
            assert(value === 'test123'); // true
        });

    :addValueSync.js
    it('should demonstrate the addValue command', function () {
        browser
            .setValue('.input', 'test')
            .addValue('.input', '123')

        var value = browser.getValue('.input')
        assert(value === 'test123'); // true
    });
 * </example>
 *
 * @param {String}        selector   Input element
 * @param {String|Number} values     value to be added
 *
 * @uses protocol/elements, protocol/elementIdValue
 * @type action
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let addValue = function (selector, value) {
    /*!
     * parameter check
     */
    if (typeof value === 'number') {
        value = '' + value
    }

    if (typeof value !== 'string' && !Array.isArray(value)) {
        throw new CommandError('number or type of arguments don\'t agree with addValue command')
    }

    return this.elements(selector).then((res) => {
        if (!res.value || res.value.length === 0) {
            /*!
             * throw NoSuchElement error if no element was found
             */
            throw new CommandError(7)
        }

        let self = this
        let elementIdValueCommands = []

        for (let elem of res.value) {
            elementIdValueCommands.push(self.elementIdValue(elem.ELEMENT, value))
        }

        return this.unify(elementIdValueCommands)
    })
}

export default addValue
