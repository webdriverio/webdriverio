import type { ProtocolCommandResponse } from '../types'

// selenium types
export default interface SeleniumCommands {
    /**
     * Selenium Protocol Command
     *
     * Upload a file to remote machine on which the browser is running.
     * @ref https://www.seleniumhq.org/
     *
     */
    file(file: string): string

    /**
     * Selenium Protocol Command
     *
     * Receive hub config remotely.
     * @ref https://github.com/nicegraham/selenium-grid2-api#gridapihub
     *
     */
    getHubConfig(): ProtocolCommandResponse

    /**
     * Selenium Protocol Command
     *
     * Get the details of the Selenium Grid node running a session.
     * @ref https://github.com/nicegraham/selenium-grid2-api#gridapitestsession
     *
     */
    gridTestSession(session: string): ProtocolCommandResponse

    /**
     * Selenium Protocol Command
     *
     * Get proxy details.
     * @ref https://github.com/nicegraham/selenium-grid2-api#gridapiproxy
     *
     */
    gridProxyDetails(id: string): ProtocolCommandResponse

    /**
     * Selenium Protocol Command
     *
     * Manage lifecycle of hub node.
     * @ref https://github.com/nicegraham/selenium-grid2-api#lifecycle-manager
     *
     */
    manageSeleniumHubLifecycle(action: string): void

    /**
     * Selenium Protocol Command
     *
     * Send GraphQL queries to the Selenium (hub or node) server to fetch data. (Only supported with Selenium v4 Server)
     * @ref https://www.selenium.dev/documentation/grid/advanced_features/graphql_support/
     *
     * @example
     * ```js
     * const result = await browser.queryGrid('{ nodesInfo { nodes { status, uri } } }');
     * console.log(JSON.stringify(result, null, 4))
     * //
     * // outputs:
     * // {
     * //   "data": {
     * //     "nodesInfo": {
     * //       "nodes": [{
     * //         "status": "UP",
     * //         "uri": "http://192.168.0.39:4444"
     * //       }]
     * //     }
     * //   }
     * // }
     * //
     * ```
     */
    queryGrid(query: string): ProtocolCommandResponse
}
