import logger from 'wdio-logger'

const log = logger('wdio-devtools-service:CommandHandler')

export default class CommandHandler {
    constructor (client, browser) {
        this.client = client
        this.browser = browser

        /**
         * allow to easily access the CDP from the browser object
         */
        this.browser.addCommand('cdp', ::this.cdp)
        /**
         * helper method to receive Chrome remote debugging connection data to
         * e.g. use external tools like lighthouse
         */
        this.browser.addCommand('cdpConnection', ::this.cdpConnection)
        /**
         * get nodeId to use for other commands
         */
        this.browser.addCommand('getNodeId', ::this.getNodeId)

        /**
         * propagate CDP events to the browser event listener
         */
        this.client.on('event', (event) => {
            const method = event.method || 'event'
            log.debug(`cdp event: ${method} with params ${JSON.stringify(event.params)}`)
            this.browser.emit(method, event.params)
        })
    }

    cdp (domain, command, args = {}) {
        if (!this.client[domain]) {
            throw new Error(`Domain "${domain}" doesn't exist in the Chrome DevTools protocol`)
        }

        if (!this.client[domain][command]) {
            throw new Error(`The "${domain}" domain doesn't have a method called "${command}"`)
        }

        log.info(`Send command "${domain}.${command}" with args: ${JSON.stringify(args)}`)
        return new Promise((resolve, reject) => this.client[domain][command](args, (err, result) => {
            /* istanbul ignore if */
            if (err) {
                return reject(new Error(`Chrome DevTools Error: ${result.message}`))
            }

            return resolve(result)
        }))
    }

    cdpConnection () {
        const { host, port } = this.client
        return { host, port }
    }

    getNodeId (selector) {
        const document = this.browser.cdp('DOM', 'getDocument');
        return this.cdp('DOM', 'querySelector', {nodeId: document.root.nodeId, selector})
    }
}
