import type { AddressInfo } from 'node:net'
import polka from 'polka'
import { json } from '@polka/parse'

import type { JsonCompatible, JsonPrimitive, JsonObject } from '@wdio/types'

const store: JsonObject = {}
/**
 * @private
 */
export const __store = store

const validateBody: NextFn = (req, res, next) => {
    if (!req.path.endsWith('/get') && !req.path.endsWith('/set')) {
        return next()
    }
    if (req.method === 'POST' && typeof req.body.key !== 'string') {
        res.end(JSON.stringify({ error: 'Invalid payload, key is required.' }))
    }
    next()
}

export const startServer = () => new Promise<{ port: number, app: PolkaInstance }>((resolve, reject) => {
    const app = polka()
        /**
         * middleware
         * `json` middleware transforms body to json for every request or returns empty object
         */
        .use(json(), validateBody)

        // routes
        .post('/get', (req, res) => {
            const key = req.body.key as string
            const value = key === '*'
                ? store
                : store[key]
            res.end(JSON.stringify({ value }))
        })
        .post('/set', (req, res) => {
            const key = req.body.key as string

            if (key === '*') {
                throw new Error('You can\'t set a value with key "*" as this is a reserved key')
            }

            store[key] = req.body.value as JsonCompatible | JsonPrimitive
            return res.end()
        })

    /**
     * run server on a random port, `0` stands for random port
     * > If port is omitted or is 0, the operating system will assign
     * > an arbitrary unused port, which can be retrieved by using `server.address().port`
     * https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
     */
    app.listen(0, (err: Error) => {
        /* istanbul ignore next */
        if (err) {
            return reject(err)
        }
        resolve({ app, port: (app.server.address() as AddressInfo).port })
    })
})
