import nock from 'nock'
import { v4 as uuidv4 } from 'uuid'

import WebDriverMock from './WebDriverMock'

import { NO_SUCH_ELEMENT } from './constants'
import { newSession, deleteSession } from './mocks/newSession'

const ELEMENT_ID = '401c0039-3306-6a46-a98d-f5939870a249'
const ELEMENT_REFETCHED = '80d860d0-b829-f540-812e-7078eb983795'
const ELEMENT_ALT = '8bf4d107-a363-40d1-b823-d94bdbc58afb'

export default class WebdriverMockService {
    constructor() {
        this.init()
    }

    init() {
        this.mock = new WebDriverMock()
        this.command = this.mock.command

        // define required responses
        this.command.status().times(Infinity).reply(200, { value: {} })
        this.command.newSession().times(Infinity).reply(200, () => {
            newSession.value.sessionId = uuidv4()
            return newSession
        })
        this.command.deleteSession().times(2).reply(200, deleteSession)
        this.command.getTitle().times(Infinity).reply(200, { value: 'Mock Page Title' })
        this.command.getUrl().times(Infinity).reply(200, { value: 'https://mymockpage.com' })
        this.command.getElementRect(ELEMENT_ID).times(2).reply(200, { value: { width: 1, height: 2, x: 3, y: 4 } })
        this.command.getElementRect(ELEMENT_ALT).times(2).reply(200, { value: { width: 10, height: 20, x: 30, y: 40 } })
        this.command.getLogTypes().reply(200, { value: [] })
    }

    before() {
        /**
         * assign mocks to browser object to tweak responses
         */
        global.browser.mocks = this.mocks

        /**
         * register request interceptors for specific scenarios
         */
        global.browser.addCommand('waitForElementScenario', this.waitForElementScenario.bind(this))
        global.browser.addCommand('isNeverDisplayedScenario', this.isNeverDisplayedScenario.bind(this))
        global.browser.addCommand('isEventuallyDisplayedScenario', this.isEventuallyDisplayedScenario.bind(this))
        global.browser.addCommand('staleElementRefetchScenario', this.staleElementRefetchScenario.bind(this))
        global.browser.addCommand('customCommandScenario', this.customCommandScenario.bind(this))
        global.browser.addCommand('waitForDisplayedScenario', this.waitForDisplayedScenario.bind(this))
        global.browser.addCommand('cucumberScenario', this.cucumberScenario.bind(this))
        global.browser.addCommand('clickScenario', this.clickScenario.bind(this))
        global.browser.addCommand('isExistingScenario', this.isExistingScenario.bind(this))
    }

    clickScenario() {
        this.nockReset()
        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().times(2).reply(200, { value: elemResponse })
        this.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isExistingScenario() {
        this.nockReset()
        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().times(1).reply(200, { value: elemResponse })
        this.command.findElementFromElement(ELEMENT_ID).times(2).reply(200, { value: elemResponse })
        this.command.findElementsFromElement(ELEMENT_ID).times(2).reply(200, { value: [elemResponse] })
    }

    waitForElementScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().once().reply(404, NO_SUCH_ELEMENT)
        this.command.findElement().times(2).reply(200, { value: elemResponse })
        this.command.findElements().times(5).reply(200, { value: [] })
        this.command.findElements().reply(200, { value: [elemResponse] })
        this.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
    }

    isNeverDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().times(2).reply(404, NO_SUCH_ELEMENT)
        this.command.findElement().times(2).reply(200, { value: elemResponse })
        this.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    isEventuallyDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().times(1).reply(404, NO_SUCH_ELEMENT)
        this.command.findElement().times(2).reply(200, { value: elemResponse })
        this.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    staleElementRefetchScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        const elem2Response = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_REFETCHED }

        //Found initially
        this.command.findElement().once().reply(200, { value: elemResponse })
        //Initiate refetch, but its not ready
        this.command.findElement().once().reply(404, NO_SUCH_ELEMENT)
        //Always return the new element after
        this.command.findElement().times(4).reply(200, { value: elem2Response })

        //First click works
        this.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
        //Additional clicks won't for the original element
        this.command.elementClick(ELEMENT_ID).times(4).reply(500, {
            value: {
                error: 'stale element reference',
                message: 'element is not attached to the page document'
            }
        })
        //Clicks on the new element are successful
        this.command.elementClick(ELEMENT_REFETCHED).times(4).reply(200, { value: null })

        //Wait for it to exist - but 2 failed iterations
        this.command.findElements().times(2).reply(200, { value: [] })
        //Always appears thereafter
        this.command.findElements().times(4).reply(200, { value: [elem2Response] })
    }

    customCommandScenario(times = 1) {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        const elemAltResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ALT }
        this.command.findElement().times(times).reply(200, { value: elemResponse })
        this.command.findElement().times(times).reply(200, { value: elemAltResponse })
        this.command.executeScript().times(times).reply(200, { value: '2' })

        // overwrite
        this.command.deleteAllCookies().times(times).reply(200, { value: 'deleteAllCookies' })
    }

    waitForDisplayedScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        this.command.findElement().once().reply(200, { value: elemResponse })
        this.command.isElementDisplayed(ELEMENT_ID).times(4).reply(200, { value: false })
        this.command.isElementDisplayed(ELEMENT_ID).once().reply(200, { value: true })
    }

    cucumberScenario() {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        this.command.navigateTo().reply(200, { value: null })
        this.command.findElement().times(4).reply(200, { value: elemResponse })
        this.command.elementClick(ELEMENT_ID).reply(200, { value: null })
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
