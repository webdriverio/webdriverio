import type { AddressInfo } from 'node:net'
import polka from 'polka'
import { json } from '@polka/parse'

import type { JsonCompatible, JsonPrimitive, JsonObject, JsonArray } from '@wdio/types'

const MAX_TIMEOUT = 15000
const DEFAULT_TIMEOUT = 1000

/**
 * gives a value of a resource pool to the request that waits for it
 */
type PoolWaiter = (value: JsonCompatible | JsonPrimitive) => void

/**
 * the client encodes the key as one path segment, polka passes it on as is
 */
const decodeKey = (key: string) => {
    try {
        return decodeURIComponent(key)
    } catch {
        return undefined
    }
}

export const startServer = () => new Promise<{ port: number, app: PolkaInstance }>((resolve, reject) => {
    const store: JsonObject = {}
    const resourcePoolStore: Map<string, JsonArray> = new Map()
    /**
     * the requests that wait for a value of an empty pool, oldest first: a value that comes
     * in goes to the oldest one at once, it does not wait for the timeout of that request
     */
    const poolWaiters: Map<string, PoolWaiter[]> = new Map()
    const app = polka()
        /**
         * middleware
         * `json` middleware transforms body to json for every request or returns empty object
         */
        .use(json())

        // routes
        .post('/', (req, res) => {
            const key = req.body.key as string

            if (key === '*') {
                throw new Error('You can\'t set a value with key "*" as this is a reserved key')
            }

            store[key] = req.body.value as JsonCompatible | JsonPrimitive
            return res.end()
        })
        .get('/:key', (req, res, next) => {
            const key = decodeKey(req.params.key as string)
            if (key === undefined) {
                return next(`Invalid key '${req.params.key}'`)
            }
            const value = key === '*'
                ? store
                : store[key]
            res.end(JSON.stringify({ value }))
        })
        .post('/pool', (req, res, next) => {
            const key = req.body.key as string
            const value = req.body.value as JsonCompatible | JsonPrimitive

            if (!Array.isArray(value)) {
                return next('Resource pool must be an array of values')
            }

            resourcePoolStore.set(key, value)
            // the requests that wait for this pool get the first values of the new one
            const waiters = poolWaiters.get(key)
            while (waiters?.length && value.length) {
                waiters.shift()!(value.shift() as JsonCompatible | JsonPrimitive)
            }
            return res.end()
        })
        .get('/pool/:key', (req, res, next) => {
            const key = decodeKey(req.params.key as string)
            if (key === undefined) {
                return next(`Invalid key '${req.params.key}'`)
            }

            if (!resourcePoolStore.has(key)) {
                return next(`'${key}' resource pool does not exist. Set it first using 'setResourcePool'`)
            }

            const pool = resourcePoolStore.get(key) || []

            if (pool.length > 0) {
                return res.end(JSON.stringify({ value: pool.shift() }))
            }

            const timeout = Math.min(parseInt(req.query.timeout as string) || DEFAULT_TIMEOUT, MAX_TIMEOUT)
            const waiters = poolWaiters.get(key) || []
            poolWaiters.set(key, waiters)

            const stopWaiting = () => {
                clearTimeout(timer)
                const index = waiters.indexOf(waiter)
                if (index !== -1) {
                    waiters.splice(index, 1)
                }
            }
            const waiter: PoolWaiter = (value) => {
                stopWaiting()
                res.end(JSON.stringify({ value }))
            }
            const timer = setTimeout(() => {
                stopWaiting()
                next(`'${key}' resource pool is empty. Set values to it first using 'setResourcePool' or 'addValueToPool'`)
            }, timeout)
            // a client that went away must not take a value out of the pool
            res.on('close', stopWaiting)
            waiters.push(waiter)
        })
        .post('/pool/:key', (req, res, next) => {
            const key = decodeKey(req.params.key as string)
            if (key === undefined) {
                return next(`Invalid key '${req.params.key}'`)
            }
            const value = req.body.value as JsonCompatible | JsonPrimitive
            const pool = resourcePoolStore.get(key)

            if (!pool) {
                return next(`'${key}' resource pool does not exist. Set it first using 'setResourcePool'`)
            }

            const waiter = poolWaiters.get(key)?.shift()
            if (waiter) {
                waiter(value)
            } else {
                pool.push(value)
            }
            return res.end()
        })

    /**
     * run server on a random port, `0` stands for random port
     * > If port is omitted or is 0, the operating system will assign
     * > an arbitrary unused port, which can be retrieved by using `server.address().port`
     * https://nodejs.org/api/net.html#net_server_listen_port_host_backlog_callback
     */
    app.listen(0, '127.0.0.1', (err: Error) => {
        /* istanbul ignore next */
        if (err) {
            return reject(err)
        }
        resolve({ app, port: (app.server.address() as AddressInfo).port })
    })
})
