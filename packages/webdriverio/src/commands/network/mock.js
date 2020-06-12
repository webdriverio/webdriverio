/**
 * Mock the response of a request.
 *
 * <example>
    :throttle.js
    it('should throttle the network', () => {
        // via static string
        browser.network.mock('/foo/.../bar', {
            someObj: 'foobar'
        })
    });
 * </example>
 *
 * @alias browser.mock
 * @param {String}            url            url to mock
 * @param {MockFilterOptions} filterOptions  more filters
 * @type utility
 *
 */
import NetworkInterception from '../../utils/NetworkInterception'

const SESSION_MOCKS = new Set()

export default async function mock (url, filterOptions) {
    const [page] = await this.puppeteer.pages()
    const client = await page.target().createCDPSession()

    /**
     * enable network Mocking if not already
     */
    if (SESSION_MOCKS.size === 0) {
        await client.send('Fetch.enable', {
            patterns: [{ requestStage: 'Response' }]
        })
        client.on(
            'Fetch.requestPaused',
            NetworkInterception.handleRequestInterception(client, SESSION_MOCKS)
        )
    }

    const networkInterception = new NetworkInterception(url, filterOptions)
    SESSION_MOCKS.add(networkInterception)

    return networkInterception
}
