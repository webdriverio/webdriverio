import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'
import type { Services } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import WebDriverMock from './WebDriverMock'

import { NO_SUCH_ELEMENT } from './constants'
import { newSession, deleteSession } from './mocks/newSession'

const ELEMENT_ID = '401c0039-3306-6a46-a98d-f5939870a249'
const ELEMENT_REFETCHED = '80d860d0-b829-f540-812e-7078eb983795'
const ELEMENT_ALT = '8bf4d107-a363-40d1-b823-d94bdbc58afb'

export default class WebdriverMockService implements Services.ServiceInstance {
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
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
        this._mock.command.getElementRect(ELEMENT_ID).times(3).reply(200, { value: { width: 1, height: 2, x: 3, y: 4 } })
        this._mock.command.getElementRect(ELEMENT_ALT).times(3).reply(200, { value: { width: 10, height: 20, x: 30, y: 40 } })
        this._mock.command.getElementRect(ELEMENT_REFETCHED).times(1).reply(200, { value: { width: 10, height: 20, x: 30, y: 40 } })
        this._mock.command.getLogTypes().reply(200, { value: [] })
    }

    before (
        caps: unknown,
        specs: unknown,
        browser: Browser<'async'> | MultiRemoteBrowser<'async'>
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
        this._browser.addCommand('waitForDisplayedScenario', this.waitForDisplayedScenario.bind(this))
        this._browser.addCommand('cucumberScenario', this.cucumberScenario.bind(this))
        this._browser.addCommand('clickScenario', this.clickScenario.bind(this))
        this._browser.addCommand('isExistingScenario', this.isExistingScenario.bind(this))
    }

    clickScenario() {
        this.nockReset()
        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isExistingScenario() {
        this.nockReset()
        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this._mock.command.findElement().times(1).reply(200, { value: elemResponse })
        this._mock.command.findElementFromElement(ELEMENT_ID).times(2).reply(200, { value: elemResponse })
        this._mock.command.findElementsFromElement(ELEMENT_ID).times(2).reply(200, { value: [elemResponse] })
    }

    waitForElementScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this._mock.command.findElement().once().reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.findElements().times(5).reply(200, { value: [] })
        this._mock.command.findElements().reply(200, { value: [elemResponse] })
        this._mock.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isNeverDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this._mock.command.findElement().times(2).reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    isEventuallyDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this._mock.command.findElement().times(1).reply(404, NO_SUCH_ELEMENT)
        this._mock.command.findElement().times(2).reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    staleElementRefetchScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        const elem2Response = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_REFETCHED }

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

    customCommandScenario(times = 1) {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        const elemAltResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ALT }
        this._mock.command.findElement().times(times).reply(200, { value: elemResponse })
        this._mock.command.findElement().times(times).reply(200, { value: elemAltResponse })
        this._mock.command.executeScript().times(times).reply(200, { value: '2' })

        // overwrite
        this._mock.command.deleteAllCookies().times(times).reply(200, { value: 'deleteAllCookies' })
    }

    waitForDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        this._mock.command.findElement().once().reply(200, { value: elemResponse })
        this._mock.command.isElementDisplayed(ELEMENT_ID).times(4).reply(200, { value: false })
        this._mock.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    cucumberScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
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
