import { multiremote } from '../../packages/webdriverio/build'

(async () => {
    const matrix = await multiremote({
        browserA: {
            capabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        },
        browserB: {
            capabilities: {
                browserName: 'chrome',
                chromeOptions: {
                    args: [
                        'use-fake-device-for-media-stream',
                        'use-fake-ui-for-media-stream',
                    ]
                }
            }
        }
    });

    var channel = Math.round(Math.random() * 10e10);

    await matrix.url('https://apprtc.appspot.com/r/' + channel)

    const elem = await matrix.$('#confirm-join-button')
    await elem.click()

    await matrix.pause(5000)
    await matrix.deleteSession()

    console.log('Multiremote script ran successfully') // eslint-disable-line no-console
})().catch(console.error) // eslint-disable-line no-console
