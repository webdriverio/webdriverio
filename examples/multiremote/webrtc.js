/**
 * Multiremote example
 * To run this script you need to have Babel installed on your system.
 * If not try to run: `$ npm install @babel/node`
 *
 * To execute it just run it as a spec with a fair amount of timeout:
 * $ npx babel-node ./examples/multiremote/webrtc.js
 */

const { multiremote } = require('../../packages/webdriverio/build/index.js')

;(async () => {
    const matrix = await multiremote({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                acceptInsecureCerts: true,
                'goog:chromeOptions': {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        },
        browserB: {
            port: 4445,
            capabilities: {
                browserName: 'chrome',
                acceptInsecureCerts: true,
                'goog:chromeOptions': {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        }
    })

    const channel = Math.round(Math.random() * 10e10)

    await matrix.url('https://apprtc.appspot.com/r/' + channel)

    const elem = await matrix.$('#confirm-join-button')
    await elem.click()

    await matrix.pause(5000)
    await matrix.deleteSession()

    console.log('Multiremote script ran successfully') // eslint-disable-line no-console
})().catch(console.error) // eslint-disable-line no-console
