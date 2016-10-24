/**
 *
 * Get the details of the Selenium Grid node running a session
 *
 * <example>
    :grid.js
    it('should return grid information', function () {
        console.log(browser.getGridNodeDetails())
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
 * @alias browser.getGridNodeDetails
 * @uses protocol/gridTestSession, protocol/gridProxyDetails
 * @type grid
 */

let getGridNodeDetails = function () {
    return this.gridTestSession().then((session) =>
        this.gridProxyDetails(session.proxyId).then((details) => {
            delete session.msg
            delete session.success

            delete details.msg
            delete details.success
            delete details.id

            return Object.assign(details, session)
        })
    )
    .catch(e => {
        if (e.seleniumStack && e.seleniumStack.type === 'GridApiError') {
            return {
                error: e.message
            }
        }
    })
}

export default getGridNodeDetails
