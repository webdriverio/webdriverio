/**
 *
 * Get the details of the Selenium Grid node running a session
 *
 * <example>
    :grid.js
    it('should get current session information', function () {
        var details = browser.gridTestSession();
        console.log(details);
        // {
        //     msg: 'slot found !',
        //     success: true,
        //     session: '51797b64-43e1-4018-b7fb-f900d80a37a4',
        //     internalKey: '413741ea-d48e-4346-844b-b1a90a69b3ed',
        //     inactivityTime: 219,
        //     proxyId: 'MacMiniA10’
        // }
    });
 * </example>
 *
 * @type grid
 */

import { ProtocolError } from '../utils/ErrorHandler'

let gridTestSession = function (sessionId) {
    /*!
     * parameter check
     */
    if (typeof sessionId !== 'string') {
        if (!this.requestHandler.sessionID) {
            throw new ProtocolError('The gridTestSession command needs a sessionID to work with.')
        }

        sessionId = this.requestHandler.sessionID
    }

    return this.requestHandler.create({
        path: `/testsession?session=${sessionId}`,
        method: 'GET',
        requiresSession: false,
        gridCommand: true
    })
}

export default gridTestSession
