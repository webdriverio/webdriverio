/**
 *
 * Get the details of the Selenium Grid node running a session (only when running on a Grid)
 *
 * <example>
    :grid.js
    browser.getGridNodeDetails().then(function(details) {
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
 * @uses protocol/gridTestSession, protocol/gridProxyDetails
 * @type grid
 */
import { CommandError } from '../utils/ErrorHandler'

let getGridNodeDetails = function (selector, longClick = false) {
    if (!this.isGrid) {
        throw new CommandError('getGridNodeDetails command is only supported when running on Selenium Grid')
    }

    return this.gridTestSession().then((session) =>
        this.gridProxyDetails(session.proxyId)
    )
}

export default getGridNodeDetails
