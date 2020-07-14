/**
 * > This is a __beta__ feature. Please give us feedback and file [an issue](https://github.com/webdriverio/webdriverio/issues/new/choose) if certain scenarions don't work as expected!
 *
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
 * - replace web resource with a local file (service a modifed JavaScript file) or
 * - redirect resource to a different url
 *
 * <example>
    :mock.js
    it('should mock network resources', () => {
        // via static string
        const userListMock = browser.network.mock('**' + '/users/list')
        // you can also specifying the mock even more by filtering resources
        // by headers or status code, e.g. mock only responses with specific
        // header set
        const strictMock = browser.network.mock('**', {
            // mock all json responses
            headers: { 'Content-Type': 'application/json' }
        })
    })

    it('should modify API responses', () => {
        const todoMock = browser.network.mock('**' + '/todos', {
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

    it('should modify text assets', () => {
        const scriptMock = browser.network.mock('**' + '/script.min.js')
        scriptMock.respond('./tests/fixtures/script.js')
    })

    it('should redirect web resources', () => {
        const headerMock = browser.network.mock('**' + '/header.png')
        headerMock.respond('https://media.giphy.com/media/F9hQLAVhWnL56/giphy.gif')

        const pageMock = browser.network.mock('https://google.com/')
        pageMock.respond('https://webdriver.io')
        browser.url('https://google.com')
        console.log(browser.getTitle()) // returns "WebdriverIO · Next-gen browser and mobile automation test framework for Node.js"
    })
 * </example>
 *
 * @alias browser.mock
 * @param {String}             url            url to mock
 * @param {MockFilterOptions=} filterOptions  more filters
 * @return {Mock}                             a mock object to modify the response
 * @type utility
 *
 */
import DevtoolsNetworkInterception from '../../utils/interception/devtools'
import WebDriverNetworkInterception from '../../utils/interception/webdriver'
import { getBrowserObject } from '../../utils'

const SESSION_MOCKS = new Set()

export default async function mock (url, filterOptions) {
    const NetworkInterception = this.isSauce ? WebDriverNetworkInterception : DevtoolsNetworkInterception

    /**
     * enable network Mocking if not already
     */
    if (SESSION_MOCKS.size === 0 && !this.isSauce) {
        const [page] = await this.puppeteer.pages()
        const client = await page.target().createCDPSession()
        await client.send('Fetch.enable', {
            patterns: [{ requestStage: 'Response' }]
        })
        client.on(
            'Fetch.requestPaused',
            NetworkInterception.handleRequestInterception(client, SESSION_MOCKS)
        )
    }

    const browser = getBrowserObject(this)
    const networkInterception = new NetworkInterception(url, filterOptions, browser)
    SESSION_MOCKS.add(networkInterception)

    if (this.isSauce) {
        await networkInterception.init()
    }

    return networkInterception
}
