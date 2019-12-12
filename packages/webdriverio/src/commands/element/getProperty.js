/**
 * The Get Element Property command will return the result of getting a property of an element.
 *
 * <example>
    :getProperty.js
    it('should demonstrate the getProperty command', () => {
        var elem = $('body')
        var tag = elem.getProperty('tagName')
        console.log(tag) // outputs: "BODY"
    })
 * </example>
 *
 * @alias element.getProperty
 * @param {String} property  name of the element property
 * @return {Object|String|Boolean|Number|null} the value of the property of the selected element
 */

import { getBrowserObject } from '../../utils'
import getPropertyScript from '../../scripts/getProperty'

export default function getProperty (property) {
    if (this.isW3C) {
        return this.getElementProperty(this.elementId, property)
    }

    return getBrowserObject(this).execute(
        getPropertyScript,
        { ELEMENT: this.elementId },
        property
    )
}
