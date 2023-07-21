/**
 * Multiremote example
 * To run this script you need to have Mocha installed on your system.
 * If not try to run: $ npm install mocha @babel/register
 *
 * To execute it just run it as a spec with a fair amount of timeout:
 * ```sh
 * $ npx mocha examples/multiremote/chat.js -t 9999999 --require @babel/register
 * ```
 */

const { multiremote } = require('../../packages/webdriverio/build/index.js')

let matrix, browserA, browserB

describe('multiremote example', () => {
    before(async () => {
        matrix = await multiremote({
            browserA: {
                capabilities: {
                    browserName: 'chrome',
                    acceptInsecureCerts: true
                }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    acceptInsecureCerts: true
                },
                port: 4445
            }
        })
        browserA = matrix.browserA
        browserB = matrix.browserB
    })

    it('should open chat application', async () => {
        await matrix.url('https://socketio-chat-h9jt.herokuapp.com/')
    })

    it('should login the browser', async () => {
        const nameInput = await matrix.$('.usernameInput')

        await nameInput.browserA.addValue('Browser A')
        await nameInput.browserB.addValue('Browser B')
        await matrix.keys('Enter')
    })

    it('should post something in browserA', async () => {
        const msgElemBrowserA = await browserA.$('.inputMessage')

        await msgElemBrowserA.addValue('Hey Whats up!')
        await matrix.pause(1000)
        await browserA.keys('Enter')

        await msgElemBrowserA.addValue('My name is Edgar')
        await browserA.keys('Enter')
        await matrix.pause(200)
    })

    it('should read the message in browserB', async () => {
        const msgElemBrowserB = await browserB.$('.inputMessage')
        const chatLineBrowserB = await browserB.$('.messageBody*=My name is')
        const message = await chatLineBrowserB.getText()
        const name = message.slice(11)

        await msgElemBrowserB.addValue(`Hello ${name}! How are you today?`)
        await browserB.keys('Enter')
        await matrix.pause(5000)
    })

    after(() => matrix.deleteSession())
})
