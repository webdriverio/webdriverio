import { userCommandParent } from '@wdio/utils'

/**
 * the events of a WebDriver BiDi capture: the parallel mode guard lets them pass
 */
const bidiCaptureEvents = new WeakSet<object>()

export const isBidiCaptureEvent = (event: object) => bidiCaptureEvents.has(event)

/**
 * Reporters (for example the Allure and HTML reporters) get screenshots from the
 * `command` and `result` events of the WebDriver Classic screenshot commands. A
 * WebDriver BiDi command sends no such event, so send the events of the Classic
 * command that the BiDi capture replaces.
 * @param browser    the browser that sends the events
 * @param command    the Classic command that the capture replaces
 * @param capture    takes the screenshot and resolves with its base64 data
 * @param elementId  the element of `takeElementScreenshot`
 * @returns the base64 data of the screenshot
 */
export async function withScreenshotEvents (
    browser: WebdriverIO.Browser,
    command: 'takeScreenshot' | 'takeElementScreenshot',
    capture: () => Promise<string>,
    elementId?: string
) {
    const event = {
        command,
        method: 'GET',
        endpoint: command === 'takeElementScreenshot'
            ? `/session/:sessionId/element/${elementId}/screenshot`
            : '/session/:sessionId/screenshot',
        body: {},
        // the user command that takes the screenshot, as for the Classic command
        ...userCommandParent(command)
    }
    bidiCaptureEvents.add(event)
    browser.emit('command', event)
    try {
        const data = await capture()
        browser.emit('result', { ...event, result: { value: data } })
        return data
    } catch (error) {
        browser.emit('result', { ...event, result: { error } })
        throw error
    }
}
