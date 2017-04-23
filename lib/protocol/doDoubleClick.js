/**
 *
 * Double-clicks at the current mouse coordinates (set by moveto.
 *
 * This command is depcrecated and will be removed soon. Make sure you don't use it in your
 * automation/test scripts anymore to avoid errors.
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessionsessioniddoubleclick
 * @type protocol
 *
 */

import depcrecate from '../helpers/depcrecationWarning'

export default function doDoubleClick () {
    depcrecate('doDoubleClick')
    return this.requestHandler.create({
        path: '/session/:sessionId/doubleclick',
        method: 'POST'
    })
}
