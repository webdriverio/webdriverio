import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'
import type { Services } from '@wdio/types'

import WebDriverMock from './WebDriverMock.js'

import { NO_SUCH_ELEMENT } from './constants.js'
import { newSession, deleteSession } from './mocks/newSession.js'

const ELEMENT_ID = '401c0039-3306-6a46-a98d-f5939870a249'
const ELEMENT_REFETCHED = '80d860d0-b829-f540-812e-7078eb983795'
const ELEMENT_ALT = '8bf4d107-a363-40d1-b823-d94bdbc58afb'

const ELEM_PROP = 'element-6066-11e4-a52e-4f735466cecf'

export default class WebdriverMockService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _mock = new WebDriverMock()

    constructor () {
        this.init()
    }

    init() {
        // define required responses
        this._mock.command.status().times(Infinity).reply(200, { value: {} })
        this._mock.command.newSession().times(Infinity).reply(200, () => {
            newSession.value.sessionId = uuidv4()
            return newSession
        })
        this._mock.command.deleteSession().times(2).reply(200, deleteSession)
        this._mock.command.getTitle().times(Infinity).reply(200, { value: 'Mock Page Title' })
        this._mock.command.getUrl().times(Infinity).reply(200, { value: 'https://mymockpage.com' })
        this._mock.command.getElementRect(ELEMENT_ID).times(2).reply(200, { value: { width: 1, height: 2, x: 3, y: 4 } })
        this._mock.command.getElementRect(ELEMENT_ALT).times(3).reply(200, { value: { width: 10, height: 20, x: 30, y: 40 } })
        this._mock.command.getElementRect(ELEMENT_REFETCHED).times(1).reply(200, { value: { width: 1, height: 2, x: 3, y: 4 } })
        this._mock.command.getLogTypes().reply(200, { value: [] })
    }

    before (
        caps: unknown,
        specs: unknown,
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser

        /**
         * register request interceptors for specific scenarios
         */
        this._browser.addCommand('waitForElementScenario', this.waitForElementScenario.bind(this))
        this._browser.addCommand('isNeverDisplayedScenario', this.isNeverDisplayedScenario.bind(this))
        this._browser.addCommand('isEventuallyDisplayedScenario', this.isEventuallyDisplayedScenario.bind(this))
        this._browser.addCommand('staleElementRefetchScenario', this.staleElementRefetchScenario.bind(this))
        this._browser.addCommand('customCommandScenario', this.customCommandScenario.bind(this))
        this._browser.addCommand('customSelectorScenario', this.customSelectorScenario.bind(this))
        this._browser.addCommand('waitForDisplayedScenario', this.waitForDisplayedScenario.bind(this))
        this._browser.addCommand('cucumberScenario', this.cucumberScenario.bind(this))
        this._browser.addCommand('clickScenario', this.clickScenario.bind(this))
        this._browser.addCommand('isExistingScenario', this.isExistingScenario.bind(this))
        this._browser.addCommand('isNotExistingScenario', this.isNotExistingScenario.bind(this))
        this._browser.addCommand('multiremoteFetch', this.multiremoteFetch.bind(this))
        this._browser.addCommand('asyncIterationScenario', this.asyncIterationScenario.bind(this))
        this._browser.addCommand('parentElementChaining', this.parentNextPreviousElementChaining.bind(this))
    }

    clickScenario() {
        this.nockReset()
        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }

        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isExistingScenario() {
        this.nockReset()
        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }

        this._mock.command.findElement().times(1).reply(200, { value: elemResponse })
        this._mock.command.findElementFromElement(ELEMENT_ID).times(2).reply(200, { value: elemResponse })
        this._mock.command.findElementsFromElement(ELEMENT_ID).times(2).reply(200, { value: [elemResponse] })
    }

    isNotExistingScenario() {
        this.nockReset()
        this._mock.command.findElement().reply(404, NO_SUCH_ELEMENT)
    }

    waitForElementScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }

        this._mock.command.findElement().once().reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.findElements().times(5).reply(200, { value: [] })
        this._mock.command.findElements().reply(200, { value: [elemResponse] })
        this._mock.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isNeverDisplayedScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }

        this._mock.command.findElement().times(2).reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    isEventuallyDisplayedScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }

        this._mock.command.findElement().times(1).reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    staleElementRefetchScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elem2Response = { [ELEM_PROP]: ELEMENT_REFETCHED }

        //Found initially
        this._mock.command.findElement().once().reply(200, { value: elemResponse })
        //Initiate refetch, but its not ready
        this._mock.command.findElement().once().reply(404, NO_SUCH_ELEMENT)
        //Always return the new element after
        this._mock.command.findElement().times(4).reply(200, { value: elem2Response })

        //First click works
        this._mock.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
        //Additional clicks won't for the original element
        this._mock.command.elementClick(ELEMENT_ID).times(4).reply(500, {
            value: {
                error: 'stale element reference',
                message: 'element is not attached to the page document'
            }
        })
        //Clicks on the new element are successful
        this._mock.command.elementClick(ELEMENT_REFETCHED).times(4).reply(200, { value: null })

        //Wait for it to exist - but 2 failed iterations
        this._mock.command.findElements().times(2).reply(200, { value: [] })
        //Always appears thereafter
        this._mock.command.findElements().times(4).reply(200, { value: [elem2Response] })
    }

    asyncIterationScenario () {
        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elem2Response = { [ELEM_PROP]: ELEMENT_REFETCHED }
        this._mock.command.findElements().reply(200, { value: [elemResponse, elem2Response] })
        return [ELEMENT_ID, ELEMENT_REFETCHED]
    }

    parentNextPreviousElementChaining () {
        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elemParentResponse = { [ELEM_PROP]: ELEMENT_REFETCHED }
        this._mock.command.findElement().reply(200, { value: elemResponse })
        this._mock.command.executeScript().reply(200, { value: elemParentResponse })
        this._mock.command.getElementText(ELEMENT_REFETCHED).reply(200, { value: 'some element text' })
    }

    multiremoteFetch () {
        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elem2Response = { [ELEM_PROP]: ELEMENT_REFETCHED }

        this._mock.command.findElement().twice().reply(200, { value: elemResponse })
        this._mock.command.findElementFromElement(ELEMENT_ID).twice().reply(200, { value: elem2Response })
        this._mock.command.elementClick(ELEMENT_REFETCHED).twice().reply(200, { value: null })
    }

    customCommandScenario(times = 1) {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elemAltResponse = { [ELEM_PROP]: ELEMENT_ALT }
        this._mock.command.findElement().times(times).reply(200, { value: elemResponse })
        this._mock.command.findElement().times(times).reply(200, { value: elemAltResponse })
        this._mock.command.executeScript().times(times).reply(200, { value: '2' })

        // overwrite
        this._mock.command.deleteAllCookies().times(times).reply(200, { value: 'deleteAllCookies' })
    }

    customSelectorScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        const elemAltResponse = { [ELEM_PROP]: ELEMENT_ALT }
        this._mock.command.findElement().reply(200, { value: elemResponse })
        this._mock.command.executeScript().reply(200, { value: elemAltResponse })
        this._mock.command.findElementFromElement(ELEMENT_ALT).reply(200, { value: elemResponse })
    }

    waitForDisplayedScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        this._mock.command.findElement().once().reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).times(4).reply(200, { value: false })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    cucumberScenario() {
        this.nockReset()

        const elemResponse = { [ELEM_PROP]: ELEMENT_ID }
        this._mock.command.navigateTo().reply(200, { value: null })
        this._mock.command.findElement().times(4).reply(200, { value: elemResponse })
        this._mock.command.elementClick(ELEMENT_ID).reply(200, { value: null })
    }

    nockReset() {
        nock.cleanAll()
        this.init()
    }
}

/**
 * export for 3rd party usage
 */
export { WebDriverMock }
