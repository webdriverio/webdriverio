import type Interception from '../../utils/interception/index.js'
import DevtoolsNetworkInterception from '../../utils/interception/devtools.js'
import WebDriverNetworkInterception from '../../utils/interception/webdriver.js'
import { getBrowserObject } from '../../utils/index.js'
import type { Mock } from '../../types'
import type { MockFilterOptions } from '../../utils/interception/types'

export const SESSION_MOCKS: Record<string, Set<Interception>> = {}

/**
 * Mock the response of a request. You can define a mock based on a matching
 * glob and corresponding header and status code. Calling the mock method
 * returns a stub object that you can use to modify the response of the
 * web resource.
 *
 * With the stub object you can then either return a custom response or
 * have the request fail.
 *
 * There are 3 ways to modify the response:
 * - return a custom JSON object (for stubbing API request)
 * - replace web resource with a local file (service a modified JavaScript file) or
 * - redirect resource to a different url
 *
 * :::info
 *
 * Note that using the `mock` command requires support for Chrome DevTools protocol and e.g.
 * can not be used when running automated tests in the cloud. Find out more in the
 * [Automation Protocols](/docs/automationProtocols) section.
 *
 * :::
 *
 * <example>
    :mock.js
    it('should mock network resources', async () => {
        // via static string
        const userListMock = await browser.mock('**' + '/users/list')
        // or as regular expression
        const userListMock = await browser.mock(/https:\/\/(domainA|domainB)\.com\/.+/)
        // you can also specifying the mock even more by filtering resources
        // by request or response headers, status code, postData, e.g. mock only responses with specific
        // header set and statusCode
        const strictMock = await browser.mock('**', {
            // mock all json responses
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            responseHeaders: { 'Cache-Control': 'no-cache' },
            postData: 'foobar'
        })

        // comparator function
        const apiV1Mock = await browser.mock('**' + '/api/v1', {
            statusCode: (statusCode) => statusCode >= 200 && statusCode <= 203,
            headers: (headers) => headers['Authorization'] && headers['Authorization'].startsWith('Bearer '),
            responseHeaders: (headers) => headers['Impersonation'],
            postData: (data) => typeof data === 'string' && data.includes('foo')
        })
    })

    it('should modify API responses', async () => {
        // filter by method
        const todoMock = await browser.mock('**' + '/todos', {
            method: 'get'
        })

        // mock an endpoint with a fixed fixture
        mock.respond([{
            title: 'Injected Todo',
            order: null,
            completed: false,
            url: "http://todo-backend-express-knex.herokuapp.com/916"
        }])

        // respond with different status code or header
        mock.respond([{
            title: 'Injected Todo',
            order: null,
            completed: false,
            url: "http://todo-backend-express-knex.herokuapp.com/916"
        }], {
            statusCode: 404,
            headers: {
                'x-custom-header': 'foobar'
            }
        })
    })

    it('should modify text assets', async () => {
        const scriptMock = await browser.mock('**' + '/script.min.js')
        scriptMock.respond('./tests/fixtures/script.js')
    })

    it('should redirect web resources', async () => {
        const headerMock = await browser.mock('**' + '/header.png')
        headerMock.respond('https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif')

        const pageMock = await browser.mock('https://google.com/')
        pageMock.respond('https://webdriver.io')
        await browser.url('https://google.com')
        console.log(await browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
    })
 * </example>
 *
 * @alias browser.mock
 * @param {String|RegExp}       url                             url to mock
 * @param {MockFilterOptions=}  filterOptions                   filter mock resource by additional options
 * @param {String|Function=}    filterOptions.method            filter resource by HTTP method
 * @param {Object|Function=}    filterOptions.headers           filter resource by specific request headers
 * @param {Object|Function=}    filterOptions.responseHeaders   filter resource by specific response headers
 * @param {String|Function=}    filterOptions.postData          filter resource by request postData
 * @param {Number|Function=}    filterOptions.statusCode        filter resource by response statusCode
 * @return {Mock}                                               a mock object to modify the response
 * @type utility
 *
 */
export default async function mock (
    this: WebdriverIO.Browser,
    url: string | RegExp,
    filterOptions?: MockFilterOptions
) {
    const NetworkInterception = this.isSauce ? WebDriverNetworkInterception : DevtoolsNetworkInterception

    if (!this.isSauce) {
        await this.getPuppeteer()
    }

    if (!this.puppeteer) {
        throw new Error('No Puppeteer connection could be established which is required to use this command')
    }

    const browser = getBrowserObject(this)
    const handle = await browser.getWindowHandle()
    if (!SESSION_MOCKS[handle]) {
        SESSION_MOCKS[handle] = new Set()
    }

    /**
     * enable network Mocking if not already
     */
    if (SESSION_MOCKS[handle].size === 0 && !this.isSauce) {
        const pages = await this.puppeteer.pages()

        /**
         * get active page
         */
        let page
        for (let i = 0; i < pages.length && !page; i++) {
            const isHidden = await pages[i].evaluate(() => document.hidden)
            if (!isHidden) {
                page = pages[i]
            }
        }

        /**
         * fallback to the first page
         */
        if (!page) {
            page = pages[0]
        }

        const client = await page.target().createCDPSession()
        await client.send('Fetch.enable', {
            patterns: [{ requestStage: 'Request' }, { requestStage: 'Response' }]
        })
        client.on(
            'Fetch.requestPaused',
            (NetworkInterception as unknown as typeof DevtoolsNetworkInterception)
                .handleRequestInterception(client, SESSION_MOCKS[handle])
        )
    }

    const networkInterception = new NetworkInterception(url, filterOptions, browser)
    SESSION_MOCKS[handle].add(networkInterception as Interception)

    if (this.isSauce) {
        await (networkInterception as WebDriverNetworkInterception).init()
    }

    return networkInterception as Mock
}
