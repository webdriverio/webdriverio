/**
 *
 * Get the details of the Selenium Grid node running a session
 *
 * <example>
    :grid.js
    browser.gridProxyDetails(proxyId).then(function(details) {
        console.log(details);

        // {
        //     success: true,
        //     msg: "proxy found !",
        //     id: "MacMiniA10",
        //     request: {
        //         ...
        //         configuration: {
        //             ...
        //         },
        //         capabilities: [
        //             {
        //                 ...
        //             }
        //         ]
        //     }
        // }
    })
 * </example>
 *
 * @type grid
 */

import { ProtocolError } from '../utils/ErrorHandler'

let gridProxyDetails = function (proxyId) {
    /*!
     * parameter check
     */
    if (typeof proxyId !== 'string') {
        throw new ProtocolError('The gridProxyDetails command needs a proxyId to work with.')
    }

    return this.requestHandler.create({
        path: `/proxy?id=${proxyId}`,
        method: 'GET',
        requiresSession: false,
        gridCommand: true
    })
}

export default gridProxyDetails
