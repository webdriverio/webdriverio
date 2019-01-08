import nock from 'nock'
import WebDriverMock from './WebDriverMock'

import { SESSION_ID, NO_SUCH_ELEMENT } from './constants'
import { newSession, deleteSession } from './mocks/newSession'

const ELEMENT_ID = '401c0039-3306-6a46-a98d-f5939870a249'
const ELEMENT_REFETCHED = '80d860d0-b829-f540-812e-7078eb983795'
newSession.value.sessionId = SESSION_ID

export default class WebdriverMockService {
    constructor () {
        this.init()
    }

    init () {
        this.mock = new WebDriverMock()
        this.command = this.mock.command

        // define required responses
        this.command.newSession().reply(200, newSession)
        this.command.deleteSession().reply(200, deleteSession)
        this.command.getTitle().reply(200, { value: 'Mock Page Title' })
        this.command.getLogTypes().reply(200, { value: [] })
    }

    before () {
        /**
         * assign mocks to browser object to tweak responses
         */
        global.browser.mocks = this.mocks

        /**
         * register request interceptors for specific scenarios
         */
        global.browser.addCommand('waitForElementScenario', ::this.waitForElementScenario)
        global.browser.addCommand('isNeverDisplayedScenario', ::this.isNeverDisplayedScenario)
        global.browser.addCommand('isEventuallyDisplayedScenario', ::this.isEventuallyDisplayedScenario)
        global.browser.addCommand('staleElementRefetchScenario', ::this.staleElementRefetchScenario)
    }

    waitForElementScenario () {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }

        this.command.findElement().times(1).reply(404, NO_SUCH_ELEMENT)
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

    staleElementRefetchScenario () {
        this.nockReset()

        const elemResponse = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_ID }
        const elem2Response = { 'element-6066-11e4-a52e-4f735466cecf': ELEMENT_REFETCHED }

        this.command.findElement().once().reply(200, { value: elemResponse })
        this.command.findElement().twice().reply(200, { value: elem2Response })

        this.command.elementClick(ELEMENT_ID).once().reply(200, { value: null })
        this.command.elementClick(ELEMENT_ID).times(4).reply(500, { value: {
            error: 'stale element reference error',
            message: 'stale element reference error'
        } })
        this.command.elementClick(ELEMENT_REFETCHED).once().reply(200, { value: null })
    }

    nockReset () {
        nock.cleanAll()
        this.init()
    }
}

/**
 * export for 3rd party usage
 */
export { WebDriverMock }
