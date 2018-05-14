/**
 * The Get Element Property command will return the result of getting a property of an element.
 *
 * <example>
    :getProperty.js
    it('should demonstrate the getCssProperty command', function () {
        var elem = $('body')
        var color = elem.getProperty('tagName')
        console.log(color) // outputs: "BODY"
    })
 * </example>
 *
 * @alias browser.getProperty
 * @param {String} property  name of the element property
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
