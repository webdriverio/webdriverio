/**
 *
 * Returns a list of the currently active sessions. Each session will be returned
 * as a list of JSON objects with the following keys:
 *
 * | Key          | Type   | Description    |
 * |--------------|--------|----------------|
 * | id           | string | The session ID |
 * | capabilities | object | An object describing the [session capabilities](https://w3c.github.io/webdriver/webdriver-spec.html#capabilities) |
 *
 * (Not part of the official Webdriver specification).
 *
 * @return {Object[]} a list of the currently active sessions
 *
 * @see  https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#sessions
 * @type protocol
 * @depcrecated
 *
 */

export default function sessions () {
    return this.requestHandler.create({
        path: '/sessions',
        method: 'GET',
        requiresSession: false
    })
}
