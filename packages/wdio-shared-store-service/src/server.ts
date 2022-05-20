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

const app = polka()
    /**
     * middleware
     * `json` middleware transforms body to json for every request or returns empty object
     */
    .use(json(), validateBody)

    // routes
    .post('/get', (req, res) => {
        res.end(JSON.stringify({ value: store[req.body.key as string] }))
    })
    .post('/set', (req, res) => {
        store[req.body.key as string] = req.body.value as JsonCompatible | JsonPrimitive
        return res.end()
    })

export const startServer = () => new Promise<{ port: number }>((resolve, reject) => {
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
        resolve({
            port: (app.server.address() as AddressInfo).port
        })
    })
})

export const stopServer = () => new Promise<void>((resolve) => {
    if (app.server.close) {
        return app.server.close(() => resolve())
    }
    resolve()
})
