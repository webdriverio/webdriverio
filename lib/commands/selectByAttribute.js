/**
 *
 * Select option with a specific value.
 *
 * <example>
    :example.html
    <select id="selectbox">
        <option value="someValue0">uno</option>
        <option value="someValue1">dos</option>
        <option value="someValue2">tres</option>
        <option value="someValue3">cuatro</option>
        <option value="someValue4">cinco</option>
        <option name="someName5" value="someValue5">seis</option>
    </select>

    :selectByAttributeAsync.js
    client
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue0"
        })
        .selectByAttribute('#selectbox', 'value', 'someValue3')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue3"
        })

        .selectByAttribute('#selectbox', 'name', 'someName5')
        .getValue('#selectbox').then(function(value) {
            console.log(value);
            // returns "someValue5"
        });

    :selectByAttributeSync.js
    it('should demonstrate the selectByAttribute command', function () {
        var selectBox = browser.element('#selectbox');

        var value = selectBox.getValue();
        console.log(value); // returns "someValue0"

        selectBox.selectByAttribute('value', 'someValue3');
        console.log(selectBox.getValue()); // returns "someValue3"

        selectBox.selectByAttribute('name', 'someName5');
        console.log(selectBox.getValue()); // returns "someValue5"
    });
 * </example>
 *
 * @alias browser.selectByAttribute
 * @param {String} selector   select element that contains the options
 * @param {String} attribute  attribute of option element to get selected
 * @param {String} value      value of option element to get selected
 * @uses protocol/element, protocol/elementIdClick, protocol/elementIdElement
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let selectByAttribute = function (selector, attribute, value) {
    /**
     * convert value into string
     */
    if (typeof value === 'number') {
        value = value.toString()
    }

    /**
     * get options element by xpath
     */
    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        /**
         * find option elem using xpath
         */
        var normalized = `[normalize-space(@${attribute.trim()}) = "${value.trim()}"]`
        return this.elementIdElement(res.value.ELEMENT, `./option${normalized}|./optgroup/option${normalized}`)
    }).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        /**
         * select option
         */
        return this.elementIdClick(res.value.ELEMENT)
    })
}

export default selectByAttribute
