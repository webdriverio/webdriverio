import type { AddressInfo } from 'node:net'
import polka from 'polka'
import { json } from '@polka/parse'

import type { JsonCompatible, JsonPrimitive, JsonObject } from '@wdio/types'

const store: JsonObject = {}
const resourcePoolStore: Map<string, any[]> = new Map()
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

function getValueFromPool(key: string) {
    const pool = resourcePoolStore.get(key)

    if (!pool) {
        throw new Error(`'${key}' resource pool is does not exist. Set it first using 'setResourcePool'`)
    }

    if (pool.length === 0) {
        return null
    }

    return pool.shift()
}

const MAX_TIMEOUT = 15000
const DEFAULT_TIMEOUT = 1000

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
        .post('/setResourcePool', (req, res) => {
            const key = req.body.key as string
            const value = req.body.value as JsonCompatible | JsonPrimitive

            if (!Array.isArray(value)) {
                throw new Error('Resource pool must be an array of values')
            }

            resourcePoolStore.set(key, value)
            return res.end()
        })
        .get('/getValueFromPool/:key', (req, res) => {
            const key = req.params.key as string
            let value = getValueFromPool(key)

            if (value) {
                res.end(JSON.stringify({ value }))
                return
            }

            const timeout = Math.min(parseInt(req.query.timeout as string) || DEFAULT_TIMEOUT, MAX_TIMEOUT)

            setTimeout(function secondAttempt() {
                value = getValueFromPool(key)
                if (!value) {
                    throw new Error(`'${key}' resource pool is empty. Set values to it first using 'setResourcePool'`)
                }
                res.end(JSON.stringify({ value }))
            }, timeout)
        })
        .post('/addValueToPool', (req, res) => {
            const key = req.body.key as string
            const value = req.body.value as JsonCompatible | JsonPrimitive
            const pool = resourcePoolStore.get(key)

            if (!pool) {
                throw new Error(`'${key}' resource pool is empty. Set values to it first using 'setResourcePool'`)
            }

            pool.push(value)
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
