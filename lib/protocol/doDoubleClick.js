/**
 *
 * Double-clicks at the current mouse coordinates (set by moveto.
 *
 * This command is deprecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessioniddoubleclick
 * @type protocol
 * @deprecated
 *
 */

import deprecate from '../helpers/deprecationWarning'

export default function doDoubleClick () {
    deprecate('doDoubleClick', this.options)
    return this.requestHandler.create({
        path: '/session/:sessionId/doubleclick',
        method: 'POST'
    })
}
